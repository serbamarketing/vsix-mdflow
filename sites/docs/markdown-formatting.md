---
sidebar_position: 1
title: Formatting Markdown
---

# MD Flow Markdown Formatting Guide

Welcome to the Markdown formatting guide for MD Flow. This extension supports visualizing your documents into various interactive views (Mindmap, Table, Kanban, and Calendar).

In order for MD Flow to render your Markdown files accurately across different views, you should structure your notes following the standard conventions below.

## Mindmap Hierarchy

The **Visual Tree (Mindmap)** is generated directly from the heading hierarchy (`#`) of your document. Each heading acts as a node in the tree.

```markdown
# Fitur
## Standard Feature
### Anim (Dance & Pose)
### Music Player
## Cameras
### Movement
```

## Database Grid (Table) & Metadata

Instead of standard markdown tables, MD Flow extracts metadata directly from bolded key-value pairs written beneath your headings. This allows you to define properties like Status, Deadline, or Links dynamically.

```markdown
# Fitur

**Link:** https://google.com
**Status:** 🟡 Progress
**Deadline:** 2026-08-13

## Standard Feature

**Status:** 🟡 Progress
```
These properties will automatically populate columns in the **Database Grid** view.

## Agile Workflow (Kanban)

The **Kanban Sprint Board** categorizes your nodes based on the `**Status:**` metadata property you defined. For example, assigning `**Status:** 🔴 Todo` or `**Status:** 🟡 Progress` will automatically place that block into the respective Kanban column.

```markdown
### Music Player System

Music system untuk memutar musik di dalam game.

**Link:** https://google.com
**Status:** 🔴 Todo
```

## Timeline View (Calendar)

The **Calendar View** captures explicit dates mentioned in the `**Deadline:**` metadata property (e.g., `2026-08-13`) and plots them as events or milestones on a timeline.

> **Tip:** By formatting your markdown with headings for hierarchy and bold key-value pairs for metadata, the MD Flow extension will seamlessly parse and visualize your project across all views!
