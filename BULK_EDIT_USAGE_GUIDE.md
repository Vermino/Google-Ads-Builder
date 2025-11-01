# Bulk Edit - User Guide

## Quick Start

The bulk edit feature allows you to efficiently manage multiple ad groups or ads at once. This guide will show you how to use all the bulk editing features.

## Selecting Items

### Method 1: Click Checkboxes

1. Navigate to the Campaign Builder or Ad Group Builder page
2. Check the box next to any ad group or ad to enter selection mode
3. Check additional items to add them to your selection
4. Uncheck to remove items from selection

### Method 2: Select All Checkbox

1. Click the checkbox in the header (appears when you select at least one item)
2. This will select ALL items on the current page
3. Click again to deselect all

### Method 3: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+A` (Windows) or `Cmd+A` (Mac) | Select all items |
| `Escape` | Clear all selections |
| `Delete` | Delete selected items |

## Bulk Actions

Once you have items selected, the Bulk Action Toolbar will appear at the bottom of your screen.

### Available Actions

#### 1. Duplicate

**What it does:** Creates exact copies of all selected items

**How to use:**
1. Select items you want to duplicate
2. Click the "Duplicate" button in the toolbar
3. Copies will be created immediately with " (Copy)" added to their names
4. All nested content (ads, keywords, headlines, descriptions) is also duplicated

**Example:**
- Select "Brand Campaign - Shoes"
- Click Duplicate
- New ad group created: "Brand Campaign - Shoes (Copy)"
- All ads and keywords are duplicated with new IDs

#### 2. Change Status

**What it does:** Changes the status of all selected items at once

**How to use:**
1. Select items you want to update
2. Click "Change Status" in the toolbar
3. Choose the new status:
   - **Ad Groups:** Active or Paused
   - **Ads:** Enabled, Paused, or Disabled
4. Review the list of items that will be updated
5. Click "Change Status" to confirm

**Use Case:**
Pause all ad groups during a holiday season, then re-activate them all at once.

#### 3. Delete

**What it does:** Permanently removes all selected items

**How to use:**
1. Select items you want to delete
2. Click the red "Delete" button in the toolbar
3. Review the confirmation dialog
4. Confirm deletion

**Warning for Ad Groups:**
Deleting ad groups will also delete:
- All ads in those ad groups
- All keywords in those ad groups
- All associated data

**Safety Features:**
- Confirmation modal prevents accidental deletion
- Shows exactly what will be deleted
- Cannot be undone

#### 4. Cancel

**What it does:** Clears your selection and hides the toolbar

**How to use:**
- Click "Cancel" button, OR
- Press `Escape` key

## Visual Feedback

### Selection Indicators

- **Blue Ring:** Selected items have a blue border
- **Counter:** Header shows "X selected" count
- **Toolbar:** Appears at bottom when items are selected
- **Checkbox States:**
  - Empty: Not selected
  - Checked: Selected
  - Indeterminate (dash): Some items selected

### Notifications

After each bulk action, you'll see a success notification:
- "3 ad groups deleted"
- "5 ads duplicated"
- "2 ad groups updated"

## Common Workflows

### Workflow 1: Duplicate and Modify

**Goal:** Create variations of an existing ad group

1. Select the ad group you want to vary
2. Click "Duplicate" (you now have 2 identical ad groups)
3. Clear selection (Escape key)
4. Click into the new ad group to modify it
5. Change settings, keywords, or ads as needed

### Workflow 2: Seasonal Pause

**Goal:** Pause all campaigns during off-season

1. Press `Ctrl+A` to select all ad groups
2. Click "Change Status" → "Paused"
3. Confirm the change
4. All ad groups are now paused

Later, reverse the process to reactivate.

### Workflow 3: Clean Up Low Performers

**Goal:** Delete underperforming ads

1. Review performance data
2. Select all ads with low performance
3. Press `Delete` key
4. Review the confirmation list
5. Confirm deletion
6. Selected ads are removed

### Workflow 4: Quick Test Variations

**Goal:** Create A/B test ad groups

1. Select your control ad group
2. Click "Duplicate" 3 times
3. You now have 4 identical ad groups
4. Modify each one with different strategies
5. Run all 4 to test which performs best

## Best Practices

### Selection Tips

✓ **Use Select All cautiously** - Make sure you really want to affect all items
✓ **Review before confirming** - Always check the confirmation modal lists
✓ **Start small** - Test bulk operations on 1-2 items first
✓ **Clear selections** - Press Escape after each bulk operation

### Duplication Tips

✓ **Rename immediately** - Change " (Copy)" to meaningful names
✓ **Check nested content** - Verify ads and keywords copied correctly
✓ **Update URLs if needed** - Duplicated items keep the same final URLs
✓ **Adjust bids** - Duplicated items keep the same Max CPC

### Deletion Tips

⚠ **Cannot be undone** - Deleted items are permanently removed
⚠ **Check dependencies** - Ad groups contain ads and keywords
⚠ **Export first** - Consider exporting to CSV before bulk deletion
⚠ **Use status instead** - Consider pausing instead of deleting

## Accessibility

### Keyboard Navigation

- `Tab` - Navigate between checkboxes and buttons
- `Space` - Toggle checkbox selection
- `Enter` - Activate focused button
- `Escape` - Close modals and clear selections

### Screen Reader Support

All bulk edit features are fully accessible to screen readers:
- Checkboxes announce their state and label
- Selection counts are announced
- Modal dialogs announce content
- Action buttons have descriptive labels

## Troubleshooting

### Toolbar Not Appearing

**Problem:** Selected items but toolbar doesn't show

**Solution:**
- Check if items are actually selected (blue ring)
- Scroll to bottom of page
- Try selecting again

### Cannot Select All

**Problem:** Ctrl+A doesn't work

**Solution:**
- Make sure you're focused on the page (click somewhere first)
- Try clicking the header checkbox instead
- Check if there are any items to select

### Duplicate Creates Too Many

**Problem:** Accidentally duplicated too many times

**Solution:**
1. Use Ctrl+Z if immediately after
2. Otherwise, select the duplicates
3. Delete them with bulk delete
4. Duplicates have " (Copy)" in the name for easy identification

### Keyboard Shortcuts Not Working

**Problem:** Shortcuts like Ctrl+A don't work

**Solution:**
- Click on the page content area first
- Make sure no input field is focused
- Check that items exist to select
- Try clicking a checkbox manually first

## Tips for Power Users

### Speed Tips

1. **Learn the shortcuts** - Memorize Ctrl+A, Escape, Delete
2. **Use header checkbox** - Faster than individual selection
3. **Chain operations** - Duplicate then immediately modify
4. **Keep selections small** - More selections = more confirmation time

### Efficiency Tips

1. **Name things well** - Makes selection easier later
2. **Use filters** (future feature) - Select by criteria
3. **Export backups** - Before major bulk deletions
4. **Test on copies** - Duplicate before experimenting

### Advanced Patterns

1. **Template Method:**
   - Create perfect "template" ad group
   - Duplicate it many times
   - Modify each variation

2. **Bulk Testing:**
   - Select all test variants
   - Pause all at once when test complete
   - Delete losers, keep winners

3. **Reorganization:**
   - Duplicate items to new structure
   - Verify new structure works
   - Delete old structure

## Need Help?

If you encounter issues with bulk edit features:

1. Check this guide for solutions
2. Verify items are properly selected
3. Try refreshing the page
4. Check browser console for errors
5. Report bugs with specific steps to reproduce

## What's Next?

Future enhancements planned:
- Shift+Click for range selection
- Bulk edit more fields (URLs, Max CPC)
- Undo/Redo functionality
- Export selected items only
- Bulk move between campaigns
- Custom bulk actions

---

**Remember:** Bulk operations are powerful - always double-check before confirming destructive actions!
