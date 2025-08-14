# Email Template System Documentation

## Overview

The PLSOM Assessment Notification System uses a sophisticated template hierarchy that provides consistent branding, professional styling, and excellent email client compatibility through both HTML and text versions.

## 📁 Template Structure

```
templates/emails/
├── base_email.html          # Base template with common styling
├── test_created.html        # HTML: New test available
├── test_created.txt         # Text: New test available
├── test_published.html      # HTML: Test published
├── test_published.txt       # Text: Test published  
├── test_updated.html        # HTML: Test updated
├── test_updated.txt         # Text: Test updated
├── test_deadline_reminder.html  # HTML: Deadline reminder
├── test_deadline_reminder.txt   # Text: Deadline reminder
├── test_deleted.html        # HTML: Test removed
├── test_deleted.txt         # Text: Test removed
├── test_notification.html   # HTML: Generic notification
└── test_notification.txt    # Text: Generic notification
```

## 🎨 Base Template System

### `base_email.html` Features

#### **Professional Styling**
- Responsive design that works on all devices
- PLSOM branding with ministry-appropriate colors
- Clean, readable typography using Georgia serif font
- Consistent spacing and visual hierarchy

#### **Customizable Components**
The base template provides blocks that child templates can override:

```django
{% block title %}{% endblock %}           # Email title
{% block header_icon %}📝{% endblock %}   # Header emoji
{% block header_title %}{% endblock %}    # Main header text
{% block accent_color %}#3498db{% endblock %}  # Theme color
{% block button_color %}#3498db{% endblock %}  # CTA button color
{% block content %}{% endblock %}         # Main email content
{% block blessing %}{% endblock %}        # Custom blessing message
{% block closing %}Grace and peace{% endblock %}  # Closing phrase
{% block footer_motto %}{% endblock %}    # Custom footer text
```

#### **Built-in Components**
- **Test Info Boxes**: Highlighted sections for test details
- **Notice Boxes**: Color-coded alerts (success, warning, urgent)
- **Deadline Alerts**: Special formatting for time-sensitive info
- **Details Lists**: Formatted lists with consistent styling
- **CTA Buttons**: Prominent call-to-action buttons
- **Signature Section**: Professional email closing

### **Color Themes by Notification Type**

| Notification Type | Primary Color | Usage |
|------------------|---------------|-------|
| Test Created | `#3498db` (Blue) | Informational, welcoming |
| Test Published | `#27ae60` (Green) | Success, positive news |
| Test Updated | `#f39c12` (Orange) | Warning, requires attention |
| Deadline Reminder | `#e74c3c` (Red) | Urgent, time-sensitive |
| Test Deleted | `#7f8c8d` (Gray) | Neutral, informational |

## 📱 Responsive Design

### **Mobile Optimization**
- Fluid layouts that adapt to screen size
- Touch-friendly button sizes
- Readable font sizes on small screens
- Optimized spacing for mobile viewing

### **Email Client Compatibility**
- Works in Outlook, Gmail, Apple Mail, etc.
- Fallback styles for older email clients
- Progressive enhancement approach

## 📝 Text Templates

### **Purpose**
- Accessibility for screen readers
- Compatibility with text-only email clients
- Fallback for HTML rendering issues
- Better deliverability (some spam filters prefer text versions)

### **Format Standards**
```
TITLE: Test Name
Perfect Love School of Ministry

Dear Student,

=== SECTION HEADERS ===
Content organized with clear sections

⏰ VISUAL CUES: Important information highlighted
📋 EMOJIS: Used sparingly for emphasis

Grace and peace,
Instructor Name
PLSOM Academic Team

---
Footer information
```

### **Consistent Elements**
- Clear section dividers with `===`
- Emoji indicators for important information
- Structured layout with consistent spacing
- Professional signature format
- Ministry-appropriate language

## 🛠️ Template Usage

### **Extending Base Template**
```django
{% extends "emails/base_email.html" %}

{% block title %}Custom Title{% endblock %}
{% block header_icon %}🎉{% endblock %}
{% block header_title %}Custom Header{% endblock %}
{% block accent_color %}#27ae60{% endblock %}

{% block content %}
<div class="test-info">
    <h2>{{ test.title }}</h2>
    <p><strong>Course:</strong> {{ course.name }}</p>
</div>

<div class="notice-box success">
    <strong>Great news!</strong> Your test is ready.
</div>
{% endblock %}
```

### **Template Selection in Code**
```python
html_template_map = {
    "created": "emails/test_created.html",
    "published": "emails/test_published.html",
    # ...
}

text_template_map = {
    "created": "emails/test_created.txt", 
    "published": "emails/test_published.txt",
    # ...
}

html_message = render_to_string(html_template, context)
plain_message = render_to_string(text_template, context)
```

## 🎨 CSS Classes Available

### **Layout Components**
- `.test-info` - Test information boxes
- `.details-list` - Structured lists with headers
- `.notice-box` - Informational alerts
- `.deadline-alert` - Time-sensitive warnings
- `.cta-button` - Call-to-action buttons

### **Notice Box Variants**
- `.notice-box.success` - Green success messages
- `.notice-box.warning` - Orange warning messages  
- `.notice-box.urgent` - Red urgent alerts

### **Typography**
- Consistent heading hierarchy (h1, h2, h3)
- Professional body text styling
- Emphasized text with `<strong>` tags
- Styled lists with proper spacing

## 📧 Email Context Variables

### **Always Available**
```python
{
    'test': test_object,
    'course': test.course,
    'cohort': test.cohort, 
    'instructor': test.created_by,
    'notification_type': 'created|updated|deleted|published|deadline_reminder'
}
```

### **Test Object Properties**
- `test.title` - Test name
- `test.description` - Test description
- `test.instructions` - Student instructions
- `test.time_limit_minutes` - Time limit
- `test.max_attempts` - Maximum attempts allowed
- `test.total_questions` - Number of questions
- `test.available_until` - Deadline
- `test.randomize_questions` - Boolean for randomization

## 🔧 Customization Guide

### **Adding New Notification Types**
1. Create HTML template extending base
2. Create corresponding text template
3. Add to template maps in `tasks.py`
4. Add subject line to `subject_map`

### **Modifying Base Template**
- Update `base_email.html` for global changes
- Use CSS variables for easy color theming
- Test changes across all notification types

### **Brand Updates**
- Update colors in base template CSS
- Modify footer branding
- Update ministry-specific messaging

## 🚀 Performance Considerations

### **Template Caching**
- Django automatically caches compiled templates
- No additional caching configuration needed
- Templates are compiled once per server restart

### **Image Optimization**
- No external images used (better deliverability)
- Emoji characters for visual appeal
- Pure CSS styling for all visual elements

## 🔍 Testing Templates

### **Development Testing**
```python
# Test template rendering
from django.template.loader import render_to_string

context = {
    'test': test_instance,
    'course': course_instance,
    'cohort': cohort_instance,
    'instructor': instructor_instance,
}

html_output = render_to_string('emails/test_created.html', context)
text_output = render_to_string('emails/test_created.txt', context)
```

### **Email Client Testing**
- Test in multiple email clients
- Check mobile responsiveness
- Verify text fallback works
- Test with and without images enabled

## 📋 Best Practices

1. **Consistency**: Always use the base template for new emails
2. **Accessibility**: Include meaningful alt text and clear structure
3. **Ministry Focus**: Use appropriate, encouraging language
4. **Testing**: Test both HTML and text versions
5. **Performance**: Keep templates lightweight and fast-loading

This template system provides a professional, maintainable foundation for all PLSOM assessment notifications while ensuring excellent user experience across all email clients and devices.
