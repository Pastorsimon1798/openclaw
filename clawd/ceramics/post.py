#!/usr/bin/env python3
"""
Ceramics Social Post Generator
Generates captions, hashtags, and photo suggestions for pieces
"""

import sqlite3
import json
import os
import argparse
import sys
from datetime import datetime

DB_PATH = os.path.expanduser("~/clawd/ceramics/ceramics.sqlite")
SOCIAL_POSTS_FILE = os.path.expanduser("~/clawd/ceramics/social-posts.json")

CAPTION_STYLES = {
    'aesthetic': [
        "{name} — {glaze} on {materials}",
        "The way the {glaze} catches light on this {type}...",
        "Quiet moments with {glaze} and clay.",
        "Finding stillness in the details. {glaze} {type}.",
    ],
    'casual': [
        "Fresh out of the kiln! This {type} came out better than expected 🎉",
        "Experimenting with {glaze} on this {type} and I'm loving how it turned out!",
        "Late night studio vibes = this {type} in {glaze} 💫",
        "Just listed this {type}! The {glaze} turned out dreamy.",
    ],
    'storytelling': [
        "This {type} started as an experiment with {glaze}. Three firings later, it's exactly what I imagined.",
        "The journey of this piece: wedging clay at midnight, glazing at dawn, pulling it from the kiln with held breath.",
        "Every {type} teaches me something. This one taught me patience with {glaze}.",
        "There's a moment when you open the kiln and the light hits just right. This {type} was that moment.",
    ],
    'technical': [
        "{glaze} over {materials}. Fired to cone 6. Dimensions: {dimensions}.",
        "Exploring the interaction between {glaze} and this clay body. {type}, {dimensions}.",
        "Testing {glaze} application techniques on {type}. Results: promising.",
        "{materials} + {glaze} = this surface. Technical notes: slow cool, heavy application.",
    ],
    'sale': [
        "Now available! {name} — {dimensions} of {glaze} goodness. Link in bio ✨",
        "This {type} is looking for a home. {glaze}, {dimensions}, ready to ship.",
        "Shop update live! Starting with this {glaze} {type}. DM to claim.",
        "Flash sale: 20% off this {type} and others in the {series} series. Today only!",
    ],
}

HASHTAG_SETS = {
    'ceramics': ['#ceramics', '#pottery', '#handmade', '#ceramicart', '#clay'],
    'glazes': ['#glaze', '#glazetech', '#ceramicglaze', '#glazecombo', '#glazeexperiment'],
    'process': ['#wheelthrown', '#handbuilt', '#potterylife', '#studiopottery', '#makersgonnamake'],
    'community': ['#pottersofinstagram', '#ceramicist', '#potter', '#claycommunity', '#ceramicstudio'],
    'shop': ['#shopsmall', '#supportlocal', '#handmadesale', '#potterysale', '#ceramicsforsale'],
}

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def generate_caption(piece, style='aesthetic'):
    """Generate caption for piece"""
    templates = CAPTION_STYLES.get(style, CAPTION_STYLES['aesthetic'])
    import random
    template = random.choice(templates)
    
    # Fill in template
    data = {
        'name': piece['name'],
        'type': piece['type'],
        'glaze': piece['glaze'],
        'materials': piece['materials'] or 'stoneware',
        'dimensions': piece['dimensions'] or '',
        'series': piece['series'] or '',
    }
    
    try:
        caption = template.format(**data)
    except KeyError:
        caption = template
    
    return caption

def generate_hashtags(style='ceramics', count=15):
    """Generate hashtag set"""
    import random
    
    # Combine relevant sets
    all_tags = []
    all_tags.extend(HASHTAG_SETS['ceramics'])
    all_tags.extend(HASHTAG_SETS['process'])
    all_tags.extend(HASHTAG_SETS['community'])
    
    if style in ['sale', 'shop']:
        all_tags.extend(HASHTAG_SETS['shop'])
    
    if style in ['technical']:
        all_tags.extend(HASHTAG_SETS['glazes'])
    
    # Random selection
    selected = random.sample(all_tags, min(count, len(all_tags)))
    return ' '.join(selected)

def get_photo_suggestions(piece_id):
    """Get best photos for posting"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM photos 
        WHERE piece_id = ? 
        ORDER BY is_primary DESC, 
                 CASE angle 
                    WHEN 'front' THEN 1 
                    WHEN 'detail' THEN 2 
                    WHEN 'lifestyle' THEN 3 
                    ELSE 4 
                 END
    """, (piece_id,))
    
    photos = cursor.fetchall()
    conn.close()
    
    suggestions = []
    for ph in photos[:4]:
        suggestions.append(f"{ph['angle'].upper()}: {ph['path']}")
    
    return suggestions

def cmd_generate(args):
    """Generate social post for piece"""
    piece_id = args.piece_id
    style = args.style or 'aesthetic'
    platform = args.platform or 'instagram'
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM pieces WHERE id = ?", (piece_id,))
    piece = cursor.fetchone()
    conn.close()
    
    if not piece:
        print(f"❌ Piece not found: {piece_id}")
        return 1
    
    print(f"📱 Generating {style} post for: {piece['name']}")
    print("=" * 60)
    
    # Generate content
    caption = generate_caption(piece, style)
    hashtags = generate_hashtags(style)
    photos = get_photo_suggestions(piece_id)
    
    print("\n📝 CAPTION:")
    print(caption)
    
    print("\n#️⃣ HASHTAGS:")
    print(hashtags)
    
    if photos:
        print("\n📸 SUGGESTED PHOTOS:")
        for p in photos:
            print(f"  • {p}")
    
    # Save to JSON if requested
    if args.save:
        post_data = {
            'id': f"post-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'piece_id': piece_id,
            'piece_name': piece['name'],
            'platform': platform,
            'style': style,
            'caption': caption,
            'hashtags': hashtags,
            'photo_suggestions': photos,
            'created_date': datetime.now().isoformat(),
            'status': 'draft'
        }
        
        # Load existing or create new
        if os.path.exists(SOCIAL_POSTS_FILE):
            with open(SOCIAL_POSTS_FILE, 'r') as f:
                data = json.load(f)
        else:
            data = {'posts': []}
        
        data['posts'].append(post_data)
        
        with open(SOCIAL_POSTS_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"\n💾 Saved to: {SOCIAL_POSTS_FILE}")
    
    print("\n" + "=" * 60)
    print("✅ Ready to post!")
    
    return 0

def cmd_list(args):
    """List saved posts"""
    if not os.path.exists(SOCIAL_POSTS_FILE):
        print("📭 No saved posts found")
        return 0
    
    with open(SOCIAL_POSTS_FILE, 'r') as f:
        data = json.load(f)
    
    posts = data.get('posts', [])
    
    if args.piece_id:
        posts = [p for p in posts if p['piece_id'] == args.piece_id]
    
    if not posts:
        print("📭 No posts found")
        return 0
    
    print(f"📱 Saved Posts ({len(posts)} total)")
    print("=" * 80)
    
    for p in posts[-20:]:  # Show last 20
        print(f"\n{p['id']} | {p['piece_name']} | {p['style']} | {p['platform']}")
        print(f"  Status: {p['status']} | Created: {p['created_date'][:10]}")
        print(f"  Caption: {p['caption'][:60]}...")
    
    return 0

def cmd_templates(args):
    """Show available caption templates"""
    print("📱 Caption Templates by Style")
    print("=" * 60)
    
    for style, templates in CAPTION_STYLES.items():
        print(f"\n{style.upper()}:")
        for t in templates:
            print(f"  • {t[:70]}...")
    
    print("\n" + "=" * 60)
    print("Hashtag Sets:")
    for name, tags in HASHTAG_SETS.items():
        print(f"  {name}: {', '.join(tags[:3])}...")
    
    return 0

def main():
    parser = argparse.ArgumentParser(
        description="Ceramics Social Post Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  ceramics-post generate piece-123 --style storytelling
  ceramics-post generate piece-123 --style sale --platform instagram --save
  ceramics-post list                          # List all saved posts
  ceramics-post list --piece-id piece-123     # List posts for piece
  ceramics-post templates                     # Show caption templates
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Generate command
    gen_parser = subparsers.add_parser('generate', help='Generate post for piece')
    gen_parser.add_argument('piece_id', help='Piece ID')
    gen_parser.add_argument('--style', choices=list(CAPTION_STYLES.keys()),
                           help='Caption style')
    gen_parser.add_argument('--platform', choices=['instagram', 'tiktok', 'facebook', 
                                                   'pinterest', 'website', 'newsletter'],
                           help='Target platform')
    gen_parser.add_argument('--save', action='store_true',
                           help='Save to social-posts.json')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List saved posts')
    list_parser.add_argument('--piece-id', help='Filter by piece ID')
    
    # Templates command
    subparsers.add_parser('templates', help='Show caption templates')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    commands = {
        'generate': cmd_generate,
        'list': cmd_list,
        'templates': cmd_templates,
    }
    
    return commands[args.command](args)

if __name__ == '__main__':
    sys.exit(main())
