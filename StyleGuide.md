Of course\! Here is a styling guideline document based on the CSS you provided. This guide is designed to help developers replicate this visual style in other projects.

-----

## Project Styling Guide

This guide outlines the core visual principles and component styles for our projects. Following these guidelines ensures a consistent and professional user experience across all applications.

The styling is built upon a system of CSS custom properties (variables) for easy theming and maintenance.

-----

### 🎨 Color Palette

Our color system is defined using CSS variables for flexibility. The default theme is green-based, with an alternative indigo-based theme available.

#### Primary Color Scheme (Default)

The primary theme uses a professional green, ideal for branding and key actions.

  * **Primary Action (`--primary-color`):** `#005826` - Used for buttons, table headers, and focused input borders.
  * **Primary Hover (`--primary-hover-color`):** `rgb(40, 120, 42)` - Used when hovering over primary action elements.
  * **Focus Shadow (`--root-focus-color`):** `rgba(97, 192, 92, 0.5)` - A soft glow for focused inputs.

#### Secondary & Neutral Colors

These colors are used for text, backgrounds, and borders.

  * **Main Background (`--background-color`):** `#ffffff` (White)
  * **Primary Text (`--secondary-color`):** `#444444` - For main headings (`h1`).
  * **Secondary Text (`--secondary-light-color`):** `#555555` - For subheadings (`h2`) and body text.
  * **Borders (`--input-border-color`):** `#cccccc` - Default border for inputs.

#### System & Feedback Colors

These colors provide visual feedback to the user for different states.

  * **Information:**
      * Text (`--message-info-text-color`): `#239711`
      * Background (`--message-info-bg-color`): `#e5fde3`
      * Border (`--message-info-border-color`): `#239711`
  * **Error:**
      * Text (`--message-error-text-color`): `#e57373`
      * Background (`--message-error-bg-color`): `#fbe9e7`
      * Border (`--message-error-border-color`): `#ffccbc`
  * **Deleted/Removed Item:**
      * Text (`--file-item-deleted-text-color`): `#721c24`
      * Background (`--file-item-deleted-bg-color`): `#f8d7da`

-----

### ✍️ Typography

The typography is clean and readable, with a clear hierarchy.

  * **Main Heading (`h1`):**
      * Font Size: `2.8rem`
      * Color: `var(--secondary-color)`
  * **Subheading (`h2`):**
      * Font Size: `1.6rem`
      * Color: `var(--secondary-light-color)`
  * **Paragraph (`p`):**
      * Font Size: `1.2rem`
      * Color: `var(--secondary-light-color)`

-----

### 🏗️ Layout & Containers

The main content is housed in clean, card-like containers with subtle shadows.

  * **Main Container (`.s3-file-manager`, `.user-management-container`):**
      * **Background:** White (`--background-color`)
      * **Padding:** `2.5rem`
      * **Border Radius:** `8px`
      * **Box Shadow:** `0 8px 16px rgba(0, 0, 0, 0.1)`
      * **Hover Effect:** Lifts up (`transform: translateY(-5px)`) and the shadow intensifies.

-----

### 🧩 Components

Here are the key reusable UI components and their styles.

#### Buttons

  * **Primary Button (`.action-button`):**

      * **Background:** `var(--primary-color)`
      * **Text Color:** `#fff`
      * **Padding:** `1rem 2rem`
      * **Border Radius:** `5px`
      * **Hover State:** Background changes to `var(--primary-hover-color)` and the button scales up (`transform: scale(1.05)`).
      * **Disabled State (`.disabled`):** Background is `#ddd`, cursor is `not-allowed`, and hover effects are removed.

  * **Icon Button (`.icon-button`):**

      * **Background:** Transparent
      * **Icon Color:** `var(--primary-color)`
      * **Hover State:** Background becomes `lightgray`, icon color changes to `var(--primary-hover-color)`, and it scales up.

  * **Cancel Button (`.cancel-button`):**

      * **Background:** Transparent
      * **Text Color:** `var(--primary-color)`
      * **Hover State:** Background becomes `var(--message-info-bg-color)` and text color changes to `var(--primary-hover-color)`.

#### Forms & Inputs

  * **Text Input (`input[type="text"]`, `.login-input`):**
      * **Padding:** `1rem`
      * **Border:** `1px solid var(--input-border-color)`
      * **Border Radius:** `5px`
      * **Focus State:** The border color changes to `var(--primary-color)` and a soft shadow (`var(--input-focus-shadow-color)`) appears.

#### Tables

  * **Table Header (`.user-management-th`):**

      * **Background:** `var(--primary-color)`
      * **Text Color:** `var(--table-header-text-color)` (`#fff`)
      * **Font Size:** `1.1rem`

  * **Table Row (`.user-management-tr`):**

      * **Alternating Rows:** `nth-child(even)` has a light background (`var(--form-bg-color)`).
      * **Hover State:** Background becomes `var(--table-row-hover-bg-color)` (`#f5f5f5`).

#### Alerts & Messages

  * **Base Message (`.message`):** Used for informational feedback. Styled with the **Information** feedback colors.
  * **Error Message (`.message.error`):** Used for error feedback. Add the `.error` class to a message element to apply the **Error** feedback colors.

#### Modals

  * To activate a modal, apply the `.blurred-background` class to the main content container.
  * The modal itself (`.modal`) appears centered on top of a semi-transparent overlay (`.overlay`).

-----

### 🎨 Theming

This stylesheet includes an alternative color theme. To switch to the indigo-based theme, apply the **`.old-color-scheme`** class to a parent container (e.g., `<body>` or the main app wrapper). This will override the default green-based CSS variables.

```html
<body class="old-color-scheme">
  </body>
```

-----

### 📱 Responsive Design

The layout adapts for smaller screens (max-width: 768px).

  * The main container's width is adjusted to `90%` and padding is reduced to `1.5rem`.
  * Font sizes for headings (`h1`, `h2`), inputs, and buttons are reduced for better readability on small devices.