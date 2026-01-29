# Ceramics Business Intelligence System

**Phase 1: Foundation - Complete**

A comprehensive business intelligence system for ceramic artists to track inventory, sales, opportunities, and social media content.

## 📁 Structure

```
~/clawd/ceramics/
├── ceramics.sqlite      # Main database
├── schema.sql           # Database schema
├── init_db.py          # Database initialization
├── cli.py              # Main CLI tool
├── photo.py            # Photo organization
├── post.py             # Social post generator
├── photos/             # Photo storage
│   ├── 2025/          # Year-based organization
│   ├── 2026/
│   └── 2027/
├── backups/           # Database backups
├── reports/           # Generated reports
└── social-posts.json  # Saved post content
```

## 🚀 Quick Start

### CLI Tools Available

| Command | Description |
|---------|-------------|
| `ceramics` | Main inventory/sales CLI |
| `ceramics-photo` | Photo organization |
| `ceramics-post` | Social post generator |

### Add Your First Piece

```bash
ceramics add
# Follow interactive prompts
```

### View Inventory

```bash
ceramics list                           # All pieces
ceramics list --status ready-for-sale   # Ready to sell
ceramics list --type vase               # Only vases
ceramics list --series "Summer Series"  # By series
```

### Search

```bash
ceramics search blue                    # Search all fields
ceramics search "layered glaze"         # Multi-word search
```

### Record a Sale

```bash
ceramics sale piece-id-123 --price 150 --platform etsy
# Or interactively:
ceramics sale piece-id-123
```

### Business Stats

```bash
ceramics stats                          # Full dashboard
```

## 📸 Photo Organization

### Photo Directory Structure

```
photos/
├── 2025/
│   ├── piece-blue-vase-20250115/
│   │   ├── piece-blue-vase-20250115-front-202501151430.jpg
│   │   ├── piece-blue-vase-20250115-side-202501151430.jpg
│   │   └── piece-blue-vase-20250115-detail-202501151432.jpg
```

### Standard Angles

- `front` - Primary/front view
- `side` - Side/profile view
- `detail` - Close-up detail
- `studio` - Studio/in-progress shot
- `lifestyle` - Styled/lifestyle context
- `back`, `top`, `bottom` - Alternate views
- `other` - Miscellaneous

### Photo Commands

```bash
# Add photos for a piece
ceramics-photo add piece-id photo1.jpg photo2.jpg --angle front

# Batch process a directory
ceramics-photo batch piece-id ./raw-photos/ --size web

# Resize for different platforms
ceramics-photo resize piece-id --size social    # 1080x1080
ceramics-photo resize piece-id --size etsy      # 2000x2000

# List photos for a piece
ceramics-photo list piece-id

# System info
ceramics-photo info
```

### Photo Sizes

| Size | Dimensions | Use Case |
|------|------------|----------|
| web | 1200x1200 | Website/shop |
| social | 1080x1080 | Instagram/TikTok |
| thumbnail | 300x300 | Catalog preview |
| etsy | 2000x2000 | Etsy listings |

## 📱 Social Post Generator

### Generate Posts

```bash
# Generate and display
ceramics-post generate piece-id-123 --style storytelling

# Save for later
ceramics-post generate piece-id-123 --style sale --save

# List saved posts
ceramics-post list
ceramics-post list --piece-id piece-id-123

# View templates
ceramics-post templates
```

### Caption Styles

| Style | Tone | Best For |
|-------|------|----------|
| aesthetic | Minimal, artistic | Gallery/exhibition pieces |
| casual | Conversational | Behind-the-scenes |
| storytelling | Narrative | Process documentation |
| technical | Specifications | Professional/commercial |
| sale | Call-to-action | Shop updates |

## 📊 Database Schema

### Tables

**pieces** - Core inventory
- `id` (TEXT PRIMARY KEY) - Unique identifier
- `name` (TEXT) - Piece name
- `type` (TEXT) - Type: vase, bowl, plate, mug, sculpture, planter, other
- `dimensions` (TEXT) - e.g., "8x12x6 in"
- `glaze` (TEXT) - Glaze name
- `price` (REAL) - Sale price
- `cost` (REAL) - Production cost
- `status` (TEXT) - in-progress, ready-for-sale, listed, sold, archived, gifted
- `series` (TEXT) - Collection/series name
- `materials` (TEXT) - Clay type, cone info
- `firing_type` (TEXT) - bisque, glaze, raku, wood, gas, electric

**photos** - Piece photography
- `id` (INTEGER PRIMARY KEY)
- `piece_id` (TEXT) - References pieces
- `path` (TEXT) - Relative path to photo
- `angle` (TEXT) - Photo angle
- `is_primary` (INTEGER) - Primary photo flag
- `width`, `height` - Dimensions

**sales** - Transaction tracking
- `id` (INTEGER PRIMARY KEY)
- `piece_id` (TEXT) - References pieces
- `sale_price` (REAL)
- `platform` (TEXT) - etsy, shopify, instagram, in-person, gallery, show, wholesale, custom, other
- `buyer_name`, `buyer_email` - Customer info
- `tracking_number` - Shipping tracking

**opportunities** - Shows, galleries, commissions
- `id` (INTEGER PRIMARY KEY)
- `type` (TEXT) - gallery, show, fair, wholesale, custom-order, collaboration, commission
- `title`, `organization` - Event/venue name
- `status` (TEXT) - lead, contacted, interested, negotiating, confirmed, in-progress, completed, declined, archived
- `deadline`, `start_date`, `end_date` - Timeline
- `estimated_revenue`, `actual_revenue` - Financial tracking

**social_posts** - Content calendar
- `id` (INTEGER PRIMARY KEY)
- `piece_id` (TEXT) - Optional link to piece
- `platform` (TEXT) - instagram, tiktok, facebook, pinterest, website, newsletter
- `content` (TEXT) - Caption/content
- `hashtags` (TEXT)
- `status` (TEXT) - draft, scheduled, posted, archived

### Views

- `vw_inventory` - Pieces with photo counts and primary photo
- `vw_sales_summary` - Sales with profit calculation
- `vw_opportunities_active` - Active opportunities with deadline tracking

## 🔄 Status Workflow

```
in-progress → ready-for-sale → listed → sold
     ↓              ↓              ↓        ↓
  archived      archived      archived   archived
```

Status automatically updates `completed_date`, `listed_date`, or `sold_date` when changed.

## 🏷️ Tags & Organization

### Series
Use series to group related work:
- "Winter Collection 2025"
- "Layered Blue"
- "Speckled Earth"

### Glaze Tracking
The glaze field tracks your glaze names. Use consistent naming for analysis:
- "Shino Blue"
- "Tenmoku + Shino"
- "Ash Glaze (local)"

## 📈 Reports & Analytics

```bash
# Full business stats
ceramics stats

# Filtered lists for reporting
ceramics list --status sold --limit 20    # Recent sales
ceramics list --series "Summer 2025"      # Collection view
```

## 🛠️ Advanced Usage

### Update Piece Metadata

```bash
ceramics update piece-id-123
# Follow prompts to update fields
```

### Change Status

```bash
ceramics status piece-id-123 ready-for-sale
ceramics status piece-id-123 listed
ceramics status piece-id-123 sold
```

### Show Full Piece Details

```bash
ceramics show piece-id-123
# Shows all data, photos, sales, posts
```

## 💾 Backup

The database is automatically backed up in `~/clawd/ceramics/backups/`. You can also:

```bash
# Manual backup
cp ~/clawd/ceramics/ceramics.sqlite ~/clawd/ceramics/backups/$(date +%Y%m%d).sqlite
```

## 🔗 Integration Points

### Social Post Generator
Saved posts in `social-posts.json` can be:
- Reviewed with `ceramics-post list`
- Used with your existing social media workflow
- Imported to scheduling tools

### Photo Processing
Processed photos are stored with standardized naming:
`{piece-id}-{angle}-{timestamp}.jpg`

## 📋 Workflow Example

1. **Create piece**: `ceramics add`
2. **Photo shoot**: Save to `./raw-photos/`
3. **Add photos**: `ceramics-photo batch piece-id ./raw-photos/`
4. **Mark ready**: `ceramics status piece-id ready-for-sale`
5. **Generate post**: `ceramics-post generate piece-id --style sale --save`
6. **List piece**: `ceramics status piece-id listed`
7. **Make sale**: `ceramics sale piece-id --platform etsy --price 120`
8. **Check stats**: `ceramics stats`

## 🚧 Phase 2+ Roadmap

- [ ] Web dashboard for visual inventory
- [ ] Automated backup/sync
- [ ] Integration with Etsy/Shopify APIs
- [ ] Analytics dashboard
- [ ] Opportunity pipeline tracking
- [ ] Automated social scheduling
- [ ] Cost tracking & profit analysis
- [ ] Edition/series management

---

*Built with the APEX methodology. Last updated: 2026-01-28*
