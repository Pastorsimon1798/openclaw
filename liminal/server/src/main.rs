use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder, Error};
use actix_files::NamedFile;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use actix_ws::{Message, Session};
use futures_util::StreamExt;
use uuid::Uuid;

// ========== Shared State ==========

#[derive(Clone)]
struct AppState {
    ws_sessions: Arc<Mutex<HashMap<String, Session>>>,
    spinner_history: Arc<Mutex<Vec<SpinRecord>>>,
    active_spins: Arc<Mutex<Vec<ActiveSpin>>>,
}

#[derive(Serialize, Clone)]
struct SpinRecord {
    id: String,
    timestamp: String,
    mode: String,
    options: Vec<String>,
    result: String,
    duration_ms: u64,
}

#[derive(Serialize, Clone)]
struct ActiveSpin {
    id: String,
    options: Vec<String>,
    current_highlight: usize,
    spin_count: usize,
    is_complete: bool,
}

// ========== API Types ==========

#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

#[derive(Deserialize)]
struct SpinnerRequest {
    options: Vec<String>,
    mode: String,
}

#[derive(Serialize)]
struct SpinnerResult {
    result: String,
    mode: String,
    spin_id: String,
    all_options: Vec<String>,
}

#[derive(Serialize)]
struct WebSocketMessage {
    #[serde(rename = "type")]
    msg_type: String,
    payload: serde_json::Value,
}

// ========== Static Files ==========

fn static_path() -> PathBuf {
    PathBuf::from("/home/liam/liminal/server/static")
}

#[get("/")]
async fn index() -> impl Responder {
    NamedFile::open(static_path().join("index.html"))
}

#[get("/static/{filename:.*}")]
async fn static_files(filename: web::Path<String>) -> impl Responder {
    let path = static_path().join(filename.as_str());
    NamedFile::open(path)
}

// ========== Project APIs ==========

#[get("/api/project/{name}")]
async fn get_project(name: web::Path<String>) -> impl Responder {
    let project_path = PathBuf::from("/home/liam/liminal/projects").join(name.as_str());
    
    if !project_path.exists() {
        return HttpResponse::NotFound().json(ApiResponse::<serde_json::Value> {
            success: false,
            data: None,
            error: Some("Project not found".to_string()),
        });
    }
    
    let readme_path = project_path.join("README.md");
    let readme = if readme_path.exists() {
        std::fs::read_to_string(readme_path).ok()
    } else {
        None
    };
    
    let mut files = vec![];
    if let Ok(entries) = std::fs::read_dir(&project_path) {
        for entry in entries.flatten() {
            let metadata = entry.metadata().ok();
            files.push(serde_json::json!({
                "name": entry.file_name().to_string_lossy().to_string(),
                "is_dir": metadata.as_ref().map(|m| m.is_dir()).unwrap_or(false),
            }));
        }
    }
    
    HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "name": name.as_str(),
            "readme": readme,
            "files": files,
        })),
        error: None,
    })
}

#[get("/api/projects")]
async fn list_projects() -> impl Responder {
    let projects_dir = PathBuf::from("/home/liam/liminal/projects");
    let mut projects = vec![];
    
    if let Ok(entries) = std::fs::read_dir(&projects_dir) {
        for entry in entries.flatten() {
            if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                let name = entry.file_name().to_string_lossy().to_string();
                let readme_path = entry.path().join("README.md");
                let has_readme = readme_path.exists();
                
                projects.push(serde_json::json!({
                    "name": name,
                    "has_readme": has_readme,
                }));
            }
        }
    }
    
    HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({ "projects": projects })),
        error: None,
    })
}

#[get("/api/principles")]
async fn get_principles() -> impl Responder {
    let principles_path = PathBuf::from("/home/liam/liminal/PRINCIPLES.md");
    
    match std::fs::read_to_string(principles_path) {
        Ok(content) => HttpResponse::Ok().json(ApiResponse {
            success: true,
            data: Some(serde_json::json!({ "content": content })),
            error: None,
        }),
        Err(e) => HttpResponse::InternalServerError().json(ApiResponse::<serde_json::Value> {
            success: false,
            data: None,
            error: Some(format!("Failed to read principles: {}", e)),
        }),
    }
}

// ========== Spinner APIs ==========

#[post("/api/spinner/spin")]
async fn spinner_spin(
    req: web::Json<SpinnerRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    use rand::seq::SliceRandom;
    use std::time::Instant;
    
    if req.options.is_empty() {
        return HttpResponse::BadRequest().json(ApiResponse::<serde_json::Value> {
            success: false,
            data: None,
            error: Some("No options provided".to_string()),
        });
    }
    
    let start = Instant::now();
    let spin_id = Uuid::new_v4().to_string();
    
    // Create active spin for WebSocket visualization
    let active_spin = ActiveSpin {
        id: spin_id.clone(),
        options: req.options.clone(),
        current_highlight: 0,
        spin_count: 0,
        is_complete: false,
    };
    
    {
        let mut spins = state.active_spins.lock().unwrap();
        spins.push(active_spin);
    }
    
    // Broadcast spin start to all WebSocket clients
    broadcast_ws_message(&state, WebSocketMessage {
        msg_type: "spin_start".to_string(),
        payload: serde_json::json!({
            "spin_id": &spin_id,
            "options": &req.options,
            "mode": &req.mode,
        }),
    }).await;
    
    // Simulate spinning animation steps
    let options_count = req.options.len();
    let total_spins = 15 + rand::random::<usize>() % 10;
    
    for i in 0..total_spins {
        let highlight = i % options_count;
        let delay = 50 + (i * 20) as u64; // Get slower
        tokio::time::sleep(tokio::time::Duration::from_millis(delay)).await;
        
        broadcast_ws_message(&state, WebSocketMessage {
            msg_type: "spin_tick".to_string(),
            payload: serde_json::json!({
                "spin_id": &spin_id,
                "highlight_index": highlight,
                "current_option": &req.options[highlight],
                "progress": i as f32 / total_spins as f32,
            }),
        }).await;
        
        // Update active spin
        {
            let mut spins = state.active_spins.lock().unwrap();
            if let Some(spin) = spins.iter_mut().find(|s| s.id == spin_id) {
                spin.current_highlight = highlight;
                spin.spin_count = i;
            }
        }
    }
    
    // Final result
    let result = req.options.choose(&mut rand::thread_rng()).cloned().unwrap_or_default();
    let duration = start.elapsed().as_millis() as u64;
    
    // Record the spin
    let record = SpinRecord {
        id: spin_id.clone(),
        timestamp: chrono::Utc::now().to_rfc3339(),
        mode: req.mode.clone(),
        options: req.options.clone(),
        result: result.clone(),
        duration_ms: duration,
    };
    
    {
        let mut history = state.spinner_history.lock().unwrap();
        history.push(record);
        
        // Keep only last 100 spins
        if history.len() > 100 {
            history.remove(0);
        }
    }
    
    // Mark spin complete
    {
        let mut spins = state.active_spins.lock().unwrap();
        if let Some(spin) = spins.iter_mut().find(|s| s.id == spin_id) {
            spin.is_complete = true;
        }
    }
    
    // Broadcast result
    broadcast_ws_message(&state, WebSocketMessage {
        msg_type: "spin_complete".to_string(),
        payload: serde_json::json!({
            "spin_id": &spin_id,
            "result": &result,
            "duration_ms": duration,
        }),
    }).await;
    
    HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(SpinnerResult {
            result,
            mode: req.mode.clone(),
            spin_id,
            all_options: req.options.clone(),
        }),
        error: None,
    })
}

#[get("/api/spinner/history")]
async fn spinner_history(state: web::Data<AppState>) -> impl Responder {
    let history = state.spinner_history.lock().unwrap();
    let recent: Vec<SpinRecord> = history.iter().rev().take(20).cloned().collect();
    
    HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(recent),
        error: None,
    })
}

#[get("/api/spinner/active")]
async fn active_spins(state: web::Data<AppState>) -> impl Responder {
    let spins = state.active_spins.lock().unwrap();
    let active: Vec<ActiveSpin> = spins.iter().filter(|s| !s.is_complete).cloned().collect();
    
    HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(active),
        error: None,
    })
}

// ========== Shader Gallery APIs ==========

#[derive(Serialize)]
struct ShaderInfo {
    id: String,
    name: String,
    description: String,
    preview_params: serde_json::Value,
}

#[get("/api/shaders")]
async fn list_shaders() -> impl Responder {
    let shaders = vec![
        ShaderInfo {
            id: "liminal-noise".to_string(),
            name: "Liminal Noise".to_string(),
            description: "Fractal noise with purple cyberpunk palette".to_string(),
            preview_params: serde_json::json!({"speed": 0.1, "complexity": 5}),
        },
        ShaderInfo {
            id: "glitch-waves".to_string(),
            name: "Glitch Waves".to_string(),
            description: "Digital distortion and scanline interference".to_string(),
            preview_params: serde_json::json!({"glitch_intensity": 0.5, "scanlines": true}),
        },
        ShaderInfo {
            id: "void-particles".to_string(),
            name: "Void Particles".to_string(),
            description: "Drifting particles in dark space".to_string(),
            preview_params: serde_json::json!({"particle_count": 100, "drift": 0.2}),
        },
        ShaderInfo {
            id: "threshold-ripple".to_string(),
            name: "Threshold Ripple".to_string(),
            description: "Binary threshold with expanding ripples".to_string(),
            preview_params: serde_json::json!({"threshold": 0.5, "ripple_speed": 2.0}),
        },
    ];
    
    HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(shaders),
        error: None,
    })
}

#[get("/api/shaders/{id}")]
async fn get_shader(id: web::Path<String>) -> impl Responder {
    let shader_code = match id.as_str() {
        "liminal-noise" => include_str!("shaders/liminal_noise.glsl"),
        "glitch-waves" => include_str!("shaders/glitch_waves.glsl"),
        "void-particles" => include_str!("shaders/void_particles.glsl"),
        "threshold-ripple" => include_str!("shaders/threshold_ripple.glsl"),
        _ => return HttpResponse::NotFound().json(ApiResponse::<serde_json::Value> {
            success: false,
            data: None,
            error: Some("Shader not found".to_string()),
        }),
    };
    
    HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "id": id.as_str(),
            "code": shader_code,
        })),
        error: None,
    })
}

// ========== WebSocket Handler ==========

async fn broadcast_ws_message(state: &web::Data<AppState>, msg: WebSocketMessage) {
    let msg_json = serde_json::to_string(&msg).unwrap_or_default();
    let mut sessions = state.ws_sessions.lock().unwrap();
    
    let mut dead_sessions = vec![];
    
    for (id, session) in sessions.iter_mut() {
        if let Err(_) = session.text(msg_json.clone()).await {
            dead_sessions.push(id.clone());
        }
    }
    
    // Clean up dead sessions
    for id in dead_sessions {
        sessions.remove(&id);
    }
}

#[get("/ws")]
async fn websocket_handler(
    req: actix_web::HttpRequest,
    stream: web::Payload,
    state: web::Data<AppState>,
) -> Result<HttpResponse, Error> {
    let (response, mut session, mut stream) = actix_ws::handle(&req, stream)?;
    
    let session_id = Uuid::new_v4().to_string();
    let session_id_clone = session_id.clone();
    
    // Store session
    {
        let mut sessions = state.ws_sessions.lock().unwrap();
        sessions.insert(session_id_clone.clone(), session.clone());
    }
    
    // Send welcome message
    let welcome = WebSocketMessage {
        msg_type: "connected".to_string(),
        payload: serde_json::json!({
            "session_id": &session_id_clone,
            "message": "Connected to Liminal WebSocket",
        }),
    };
    let _ = session.text(serde_json::to_string(&welcome).unwrap()).await;
    
    // Spawn task to handle incoming messages
    actix_web::rt::spawn(async move {
        while let Some(Ok(msg)) = stream.next().await {
            match msg {
                Message::Text(text) => {
                    // Echo back for now - could handle commands here
                    let text_str = text.to_string();
                    let response = WebSocketMessage {
                        msg_type: "echo".to_string(),
                        payload: serde_json::json!({"received": text_str}),
                    };
                    let _ = session.text(serde_json::to_string(&response).unwrap()).await;
                }
                Message::Close(_) => break,
                _ => {}
            }
        }
        
        // Clean up on disconnect
        let mut sessions = state.ws_sessions.lock().unwrap();
        sessions.remove(&session_id_clone);
    });
    
    Ok(response)
}

// ========== Health Check ==========

#[get("/api/health")]
async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "alive",
        "service": "liminal-server",
        "version": "0.2.0",
        "features": ["websocket", "spinner", "shaders"],
    }))
}

// ========== Main ==========

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("🌀 Liminal Server starting on http://localhost:8081");
    println!("   WebSocket: ws://localhost:8081/ws");
    
    let state = web::Data::new(AppState {
        ws_sessions: Arc::new(Mutex::new(HashMap::new())),
        spinner_history: Arc::new(Mutex::new(Vec::new())),
        active_spins: Arc::new(Mutex::new(Vec::new())),
    });
    
    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .service(index)
            .service(static_files)
            .service(get_project)
            .service(get_principles)
            .service(spinner_spin)
            .service(list_projects)
            .service(spinner_history)
            .service(active_spins)
            .service(list_shaders)
            .service(get_shader)
            .service(websocket_handler)
            .service(health_check)
    })
    .bind("127.0.0.1:8081")?
    .run()
    .await
}
