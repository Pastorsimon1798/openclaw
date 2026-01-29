#!/usr/bin/env python3
"""
Ceramics Business Intelligence CLI
Phase 1: Foundation

Commands:
  add          - Add new piece with interactive prompts
  list         - View inventory with filters
  search       - Search pieces
  update       - Update piece metadata
  status       - Change piece status
  post         - Generate social post for piece
"""

import sqlite3
import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

# Database path
DB_PATH = os.path.expanduser("~/clawd/ceramics/ceramics.sqlite")
PHOTO_DIR = os.path.expanduser("~/clawd/ceramics/photos")

# Status and type enums
STATUSES = ['in-progress', 'ready-for-sale', 'listed', 'sold', 'archived', 'gifted']
TYPES = ['vase', 'bowl', 'plate', 'mug', 'sculpture', 'planter', 'other']
FIRING_TYPES = ['bisque', 'glaze', 'raku', 'wood', 'gas', 'electric']
PLATFORMS = ['etsy', 'shopify', 'instagram', 'in-person', 'gallery', 'show', 'wholesale', 'custom', 'other']
PHOTO_ANGLES = ['front', 'side', 'detail', 'studio', 'lifestyle', 'back', 'top', 'bottom', 'other']

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def generate_piece_id(name):
    """Generate unique piece ID from name and timestamp"""
    prefix = name.lower().replace(' ', '-')[:15]
    timestamp = datetime.now().strftime('%Y%m%d%H%M')
    return f"{prefix}-{timestamp}"

def format_piece(row):
    """Format piece data for display"""
    status_icons = {
        'in-progress': '🔨',
        'ready-for-sale': '✨',
        'listed': '🏷️',
        'sold': '💰',
        'archived': '📦',
        'gifted': '🎁'
    }
    icon = status_icons.get(row['status'], '•')
    price_str = f"${row['price']:.2f}" if row['price'] else "N/A"
    return f"{icon} {row['id']} | {row['name']} ({row['type']}) | {row['glaze']} | {price_str} | {row['status']}"

def cmd_add(args):
    """Add new piece interactively"""
    print("🔨 Add New Ceramic Piece")
    print("=" * 50)
    
    # Get inputs
    name = input("Piece name: ").strip()
    if not name:
        print("❌ Name is required")
        return 1
    
    print(f"Types: {', '.join(TYPES)}")
    piece_type = input("Type: ").strip()
    if piece_type not in TYPES:
        print(f"❌ Invalid type. Must be one of: {', '.join(TYPES)}")
        return 1
    
    dimensions = input("Dimensions (e.g., '8x12x6 in'): ").strip()
    
    glaze = input("Glaze name: ").strip()
    if not glaze:
        print("❌ Glaze is required")
        return 1
    
    price_input = input("Price (USD): ").strip()
    price = float(price_input) if price_input else None
    
    cost_input = input("Production cost (USD): ").strip()
    cost = float(cost_input) if cost_input else None
    
    series = input("Series name (optional): ").strip() or None
    
    print(f"Firing types: {', '.join(FIRING_TYPES)}")
    firing = input("Firing type (optional): ").strip() or None
    
    materials = input("Materials (e.g., 'Stoneware, cone 6'): ").strip() or None
    notes = input("Notes: ").strip() or None
    
    # Generate ID and insert
    piece_id = generate_piece_id(name)
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO pieces (id, name, type, dimensions, glaze, price, cost, 
                              series, firing_type, materials, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in-progress')
        """, (piece_id, name, piece_type, dimensions, glaze, price, cost, 
              series, firing, materials, notes))
        conn.commit()
        print(f"\n✅ Piece added: {piece_id}")
        print(f"   Status: in-progress")
        
        # Create photo directory for the year
        year = datetime.now().strftime('%Y')
        piece_photo_dir = os.path.join(PHOTO_DIR, year, piece_id)
        Path(piece_photo_dir).mkdir(parents=True, exist_ok=True)
        print(f"   Photo directory: {piece_photo_dir}")
        
    except sqlite3.IntegrityError as e:
        print(f"❌ Database error: {e}")
        return 1
    finally:
        conn.close()
    
    return 0

def cmd_list(args):
    """List inventory with filters"""
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM pieces WHERE 1=1"
    params = []
    
    if args.status:
        query += " AND status = ?"
        params.append(args.status)
    
    if args.series:
        query += " AND series = ?"
        params.append(args.series)
    
    if args.glaze:
        query += " AND glaze LIKE ?"
        params.append(f"%{args.glaze}%")
    
    if args.type:
        query += " AND type = ?"
        params.append(args.type)
    
    if args.min_price is not None:
        query += " AND price >= ?"
        params.append(args.min_price)
    
    if args.max_price is not None:
        query += " AND price <= ?"
        params.append(args.max_price)
    
    query += " ORDER BY created_date DESC"
    
    if args.limit:
        query += " LIMIT ?"
        params.append(args.limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    if not rows:
        print("📭 No pieces found matching criteria")
        conn.close()
        return 0
    
    # Summary stats
    cursor.execute("SELECT COUNT(*) FROM pieces")
    total = cursor.fetchone()[0]
    
    print(f"📦 Inventory ({len(rows)} shown, {total} total)")
    print("=" * 80)
    
    for row in rows:
        print(format_piece(row))
    
    print("=" * 80)
    print(f"Status: 🔨 in-progress | ✨ ready-for-sale | 🏷️ listed | 💰 sold | 📦 archived | 🎁 gifted")
    
    conn.close()
    return 0

def cmd_search(args):
    """Search pieces by term"""
    term = args.term.lower()
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM pieces 
        WHERE LOWER(name) LIKE ? 
           OR LOWER(glaze) LIKE ? 
           OR LOWER(series) LIKE ?
           OR LOWER(notes) LIKE ?
           OR LOWER(materials) LIKE ?
           OR LOWER(dimensions) LIKE ?
        ORDER BY created_date DESC
    """, tuple([f"%{term}%"] * 6))
    
    rows = cursor.fetchall()
    
    if not rows:
        print(f"🔍 No results for '{term}'")
        conn.close()
        return 0
    
    print(f"🔍 Search: '{term}' ({len(rows)} results)")
    print("=" * 80)
    
    for row in rows:
        print(format_piece(row))
    
    conn.close()
    return 0

def cmd_update(args):
    """Update piece metadata"""
    piece_id = args.id
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check piece exists
    cursor.execute("SELECT * FROM pieces WHERE id = ?", (piece_id,))
    piece = cursor.fetchone()
    
    if not piece:
        print(f"❌ Piece not found: {piece_id}")
        conn.close()
        return 1
    
    print(f"✏️  Updating: {piece['name']} ({piece_id})")
    print("-" * 50)
    print("Current values shown in [brackets]. Press Enter to keep.")
    print("-" * 50)
    
    updates = {}
    
    # Interactive update
    new_name = input(f"Name [{piece['name']}]: ").strip()
    if new_name:
        updates['name'] = new_name
    
    new_glaze = input(f"Glaze [{piece['glaze']}]: ").strip()
    if new_glaze:
        updates['glaze'] = new_glaze
    
    new_price = input(f"Price [{piece['price']}]: ").strip()
    if new_price:
        updates['price'] = float(new_price)
    
    new_cost = input(f"Cost [{piece['cost']}]: ").strip()
    if new_cost:
        updates['cost'] = float(new_cost)
    
    new_series = input(f"Series [{piece['series']}]: ").strip()
    if new_series:
        updates['series'] = new_series or None
    
    new_notes = input(f"Notes [{piece['notes']}]: ").strip()
    if new_notes:
        updates['notes'] = new_notes or None
    
    if not updates:
        print("No changes made.")
        conn.close()
        return 0
    
    # Build update query
    set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
    values = list(updates.values()) + [piece_id]
    
    cursor.execute(f"UPDATE pieces SET {set_clause} WHERE id = ?", values)
    conn.commit()
    
    print(f"\n✅ Updated {len(updates)} fields")
    
    conn.close()
    return 0

def cmd_status(args):
    """Change piece status"""
    piece_id = args.id
    new_status = args.status
    
    if new_status not in STATUSES:
        print(f"❌ Invalid status. Must be one of: {', '.join(STATUSES)}")
        return 1
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check piece exists
    cursor.execute("SELECT * FROM pieces WHERE id = ?", (piece_id,))
    piece = cursor.fetchone()
    
    if not piece:
        print(f"❌ Piece not found: {piece_id}")
        conn.close()
        return 1
    
    old_status = piece['status']
    
    # Update status and related dates
    updates = {'status': new_status}
    
    if new_status == 'ready-for-sale':
        updates['completed_date'] = datetime.now().isoformat()
    elif new_status == 'listed':
        updates['listed_date'] = datetime.now().isoformat()
    elif new_status == 'sold':
        updates['sold_date'] = datetime.now().isoformat()
    
    set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
    values = list(updates.values()) + [piece_id]
    
    cursor.execute(f"UPDATE pieces SET {set_clause} WHERE id = ?", values)
    conn.commit()
    
    print(f"✅ Status changed: {old_status} → {new_status}")
    
    conn.close()
    return 0

def cmd_show(args):
    """Show piece details"""
    piece_id = args.id
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM pieces WHERE id = ?", (piece_id,))
    piece = cursor.fetchone()
    
    if not piece:
        print(f"❌ Piece not found: {piece_id}")
        conn.close()
        return 1
    
    print(f"\n🔍 {piece['name']}")
    print("=" * 50)
    print(f"  ID:          {piece['id']}")
    print(f"  Type:        {piece['type']}")
    print(f"  Glaze:       {piece['glaze']}")
    print(f"  Dimensions:  {piece['dimensions'] or 'N/A'}")
    print(f"  Price:       ${piece['price']:.2f}" if piece['price'] else "  Price:       N/A")
    print(f"  Cost:        ${piece['cost']:.2f}" if piece['cost'] else "  Cost:        N/A")
    print(f"  Status:      {piece['status']}")
    print(f"  Series:      {piece['series'] or 'N/A'}")
    print(f"  Firing:      {piece['firing_type'] or 'N/A'}")
    print(f"  Materials:   {piece['materials'] or 'N/A'}")
    print(f"  Created:     {piece['created_date']}")
    print(f"  Completed:   {piece['completed_date'] or 'N/A'}")
    print(f"  Listed:      {piece['listed_date'] or 'N/A'}")
    print(f"  Sold:        {piece['sold_date'] or 'N/A'}")
    
    # Get photos
    cursor.execute("SELECT * FROM photos WHERE piece_id = ?", (piece_id,))
    photos = cursor.fetchall()
    
    if photos:
        print(f"\n📸 Photos ({len(photos)}):")
        for ph in photos:
            primary = " ⭐" if ph['is_primary'] else ""
            print(f"  - {ph['angle']}: {ph['path']}{primary}")
    
    # Get sales
    cursor.execute("SELECT * FROM sales WHERE piece_id = ?", (piece_id,))
    sales = cursor.fetchall()
    
    if sales:
        print(f"\n💰 Sales ({len(sales)}):")
        for s in sales:
            print(f"  - {s['sale_date']}: ${s['sale_price']:.2f} via {s['platform']}")
    
    # Get social posts
    cursor.execute("SELECT * FROM social_posts WHERE piece_id = ?", (piece_id,))
    posts = cursor.fetchall()
    
    if posts:
        print(f"\n📱 Social Posts ({len(posts)}):")
        for p in posts:
            print(f"  - {p['platform']} ({p['status']}): {p['post_date']}")
    
    if piece['notes']:
        print(f"\n📝 Notes:")
        print(f"  {piece['notes']}")
    
    conn.close()
    return 0

def cmd_sale(args):
    """Record a sale"""
    piece_id = args.piece_id
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check piece exists
    cursor.execute("SELECT * FROM pieces WHERE id = ?", (piece_id,))
    piece = cursor.fetchone()
    
    if not piece:
        print(f"❌ Piece not found: {piece_id}")
        conn.close()
        return 1
    
    print(f"💰 Record Sale: {piece['name']}")
    print("-" * 50)
    
    # Interactive or from args
    if args.price:
        sale_price = args.price
    else:
        price_input = input(f"Sale price [{piece['price']}]: ").strip()
        sale_price = float(price_input) if price_input else piece['price']
    
    if args.platform:
        platform = args.platform
    else:
        print(f"Platforms: {', '.join(PLATFORMS)}")
        platform = input("Platform: ").strip()
    
    if platform not in PLATFORMS:
        print(f"❌ Invalid platform")
        conn.close()
        return 1
    
    buyer_name = input("Buyer name: ").strip() or None
    buyer_email = input("Buyer email: ").strip() or None
    notes = input("Notes: ").strip() or None
    
    cursor.execute("""
        INSERT INTO sales (piece_id, sale_price, platform, buyer_name, buyer_email, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (piece_id, sale_price, platform, buyer_name, buyer_email, notes))
    
    # Piece status will auto-update via trigger
    conn.commit()
    
    print(f"\n✅ Sale recorded: ${sale_price:.2f} via {platform}")
    print(f"   Piece status auto-updated to: sold")
    
    conn.close()
    return 0

def cmd_stats(args):
    """Show inventory statistics"""
    conn = get_db()
    cursor = conn.cursor()
    
    print("\n📊 Ceramics Business Statistics")
    print("=" * 50)
    
    # Count by status
    cursor.execute("SELECT status, COUNT(*), SUM(price), SUM(cost) FROM pieces GROUP BY status")
    rows = cursor.fetchall()
    
    print("\n📦 Inventory by Status:")
    for row in rows:
        status, count, value, cost = row
        profit = (value or 0) - (cost or 0)
        print(f"  {status:15} | {count:3} pieces | ${value or 0:>8.2f} value | ${profit:>8.2f} est. profit")
    
    # Total counts
    cursor.execute("SELECT COUNT(*), SUM(price), SUM(cost) FROM pieces")
    total = cursor.fetchone()
    print(f"  {'TOTAL':15} | {total[0]:3} pieces | ${total[1] or 0:>8.2f} value | ${(total[1] or 0) - (total[2] or 0):>8.2f} est. profit")
    
    # Sales summary
    cursor.execute("""
        SELECT COUNT(*), SUM(sale_price), SUM(sale_price - cost) 
        FROM sales s JOIN pieces p ON s.piece_id = p.id
    """)
    sales = cursor.fetchone()
    
    print(f"\n💰 Sales Summary:")
    print(f"  Total sales:     {sales[0]} transactions")
    print(f"  Revenue:         ${sales[1] or 0:,.2f}")
    print(f"  Profit:          ${sales[2] or 0:,.2f}")
    
    # By platform
    cursor.execute("""
        SELECT platform, COUNT(*), SUM(sale_price) 
        FROM sales GROUP BY platform
    """)
    platforms = cursor.fetchall()
    
    if platforms:
        print(f"\n📈 By Platform:")
        for p in platforms:
            print(f"  {p[0]:15} | {p[1]:3} sales | ${p[2] or 0:,.2f}")
    
    # Photos count
    cursor.execute("SELECT COUNT(*), SUM(is_primary) FROM photos")
    photos = cursor.fetchone()
    print(f"\n📸 Photos: {photos[0]} total, {photos[1] or 0} primary")
    
    # Opportunities
    cursor.execute("SELECT COUNT(*), SUM(estimated_revenue) FROM opportunities WHERE status NOT IN ('completed', 'declined', 'archived')")
    opps = cursor.fetchone()
    print(f"🎯 Active Opportunities: {opps[0]} (${opps[1] or 0:,.2f} potential)")
    
    conn.close()
    return 0

def main():
    parser = argparse.ArgumentParser(
        description="Ceramics Business Intelligence CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  ceramics add                    # Add new piece interactively
  ceramics list                   # Show all pieces
  ceramics list --status listed   # Show listed pieces only
  ceramics search blue            # Search for 'blue'
  ceramics show piece-id-123      # Show piece details
  ceramics update piece-id-123    # Update piece
  ceramics status piece-id-123 sold  # Mark as sold
  ceramics sale piece-id-123 --price 150 --platform etsy
  ceramics stats                  # Show business statistics
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Add command
    add_parser = subparsers.add_parser('add', help='Add new piece')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List inventory')
    list_parser.add_argument('--status', choices=STATUSES, help='Filter by status')
    list_parser.add_argument('--series', help='Filter by series')
    list_parser.add_argument('--glaze', help='Filter by glaze')
    list_parser.add_argument('--type', choices=TYPES, help='Filter by type')
    list_parser.add_argument('--min-price', type=float, help='Minimum price')
    list_parser.add_argument('--max-price', type=float, help='Maximum price')
    list_parser.add_argument('--limit', type=int, help='Limit results')
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Search pieces')
    search_parser.add_argument('term', help='Search term')
    
    # Update command
    update_parser = subparsers.add_parser('update', help='Update piece')
    update_parser.add_argument('id', help='Piece ID')
    
    # Status command
    status_parser = subparsers.add_parser('status', help='Change piece status')
    status_parser.add_argument('id', help='Piece ID')
    status_parser.add_argument('status', choices=STATUSES, help='New status')
    
    # Show command
    show_parser = subparsers.add_parser('show', help='Show piece details')
    show_parser.add_argument('id', help='Piece ID')
    
    # Sale command
    sale_parser = subparsers.add_parser('sale', help='Record a sale')
    sale_parser.add_argument('piece_id', help='Piece ID')
    sale_parser.add_argument('--price', type=float, help='Sale price')
    sale_parser.add_argument('--platform', choices=PLATFORMS, help='Sales platform')
    
    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Show statistics')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    # Route to command handler
    commands = {
        'add': cmd_add,
        'list': cmd_list,
        'search': cmd_search,
        'update': cmd_update,
        'status': cmd_status,
        'show': cmd_show,
        'sale': cmd_sale,
        'stats': cmd_stats,
    }
    
    return commands[args.command](args)

if __name__ == '__main__':
    sys.exit(main())
