# Assessment Notifications System

## Overview

The assessment notifications system automatically sends email notifications to students when test events occur. The system uses Django Q for background task processing and supports multiple notification types with intelligent scheduling.

## 📧 Notification Types

### 1. Test Created (`created`)
- **Trigger**: When a new test is created AND published
- **Recipients**: All students in the test's cohort
- **Template**: `templates/emails/test_created.html`

### 2. Test Published (`published`)
- **Trigger**: When a draft test changes status to published
- **Recipients**: All students in the test's cohort
- **Template**: `templates/emails/test_published.html`

### 3. Test Updated (`updated`)
- **Trigger**: When questions are modified in a published test
- **Recipients**: All students in the test's cohort
- **Template**: `templates/emails/test_updated.html`

### 4. Test Deleted (`deleted`)
- **Trigger**: When a published test is deleted
- **Recipients**: All students in the test's cohort
- **Template**: `templates/emails/test_deleted.html`

### 5. Deadline Reminder (`deadline_reminder`)
- **Trigger**: Automatically scheduled for the day of the test deadline at 9:00 AM
- **Recipients**: All students in the test's cohort
- **Template**: `templates/emails/test_deadline_reminder.html`

## 🎯 Smart Notification Logic

### Publication Status Rules
- ✅ **Published tests**: All notifications are sent
- ❌ **Draft tests**: No notifications sent (except when publishing)
- ❌ **Archived tests**: No notifications sent

### Recipient Filtering
- Only students in the test's cohort receive notifications
- Only active students with valid email addresses
- Students with `role='student'` only

### Deadline Scheduling
- Automatically schedules reminder when test is published with a deadline
- Reschedules if deadline is updated
- Cancels if test is deleted or deadline removed
- Only schedules if deadline is in the future

## 🔧 Implementation Details

### Django Q Tasks

#### `send_test_notification_email(test_id, notification_type, user_ids=None)`
Main task function that handles email sending:
```python
# Send to all cohort students
send_test_notification_email(test_id, 'published')

# Send to specific students
send_test_notification_email(test_id, 'updated', [1, 2, 3])
```

#### `schedule_deadline_reminder(test_id)`
Schedules a one-time deadline reminder:
```python
schedule_deadline_reminder(test_id)
```

#### `cancel_deadline_reminder(test_id)`
Cancels any scheduled deadline reminder:
```python
cancel_deadline_reminder(test_id)
```

### Django Signals

The system uses Django signals to automatically trigger notifications:

#### `post_save` Signal Handler
- Detects test creation and publishing
- Handles test updates with question changes
- Manages deadline scheduling

#### `pre_delete` Signal Handler
- Sends deletion notifications for published tests
- Cancels scheduled deadline reminders

### Email Templates

All templates follow a consistent design with:
- PLSOM branding and colors
- Responsive design
- Biblical references and encouraging language
- Clear call-to-action buttons
- Test details and instructions

## 📋 Setup Instructions

### 1. Configure Django Q
Ensure Django Q is properly configured in `settings.py`:
```python
Q_CLUSTER = {
    'name': 'plsom',
    'workers': 4,
    'timeout': 60,
    'django_redis': 'default',
}
```

### 2. Email Settings
Configure email backend:
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'your-smtp-host'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@plsom.com'
EMAIL_HOST_PASSWORD = 'your-password'
DEFAULT_FROM_EMAIL = 'PLSOM Academic Team <noreply@plsom.com>'
```

### 3. Template Directory
Ensure templates are in the correct location:
```
templates/
└── emails/
    ├── test_created.html
    ├── test_published.html
    ├── test_updated.html
    ├── test_deleted.html
    └── test_deadline_reminder.html
```

## 🚀 Usage Examples

### Manual Notifications
```python
from django_q.tasks import async_task

# Send immediate notification
async_task(
    'apps.assessments.tasks.send_test_notification_email',
    test_id,
    'published'
)

# Schedule deadline reminder
from apps.assessments.tasks import schedule_deadline_reminder
schedule_deadline_reminder(test_id)
```

### Triggering from Views
```python
# In views.py
from .signals import trigger_test_published_notification

def publish_test(request, test_id):
    test = Test.objects.get(id=test_id)
    test.status = 'published'
    test.save()
    
    # Trigger notification
    trigger_test_published_notification(test.id)
```

## 📊 Monitoring and Logging

### Log Messages
The system logs all notification activities:
```
INFO: Sent published notification for test 123 to 25 recipients
INFO: Scheduled deadline reminder for test 123 at 2024-01-15 09:00:00
ERROR: Test 456 not found for notification
```

### Django Q Admin
Monitor task execution in Django Admin:
- View scheduled tasks
- Check task history
- Monitor failed tasks

## 🛠️ Customization

### Adding New Notification Types
1. Add new template in `templates/emails/`
2. Update `subject_map` and `template_map` in tasks.py
3. Create trigger function if needed

### Modifying Email Content
- Edit HTML templates for visual changes
- Update context variables in tasks.py
- Modify subject lines in `subject_map`

### Changing Notification Rules
- Modify signal handlers for different trigger conditions
- Update filtering logic in `send_test_notification_email`
- Adjust scheduling logic in `schedule_deadline_reminder`

## 🔍 Troubleshooting

### Common Issues

#### Notifications Not Sending
- Check Django Q worker is running: `python manage.py qcluster`
- Verify email configuration in settings
- Check logs for error messages

#### Deadline Reminders Not Scheduled
- Ensure test has `available_until` set
- Check timezone configuration
- Verify Django Q scheduler is working

#### Students Not Receiving Emails
- Confirm students are in the correct cohort
- Check student email addresses are valid
- Verify student role is set to 'student'

### Debug Commands
```bash
# Check Django Q status
python manage.py qmonitor

# View scheduled tasks
python manage.py qinfo

# Test email sending
python manage.py shell
>>> from apps.assessments.tasks import send_test_notification_email
>>> send_test_notification_email(test_id, 'published')
```

## 🔒 Security Considerations

- Email addresses are filtered and validated
- Only active students receive notifications
- Bulk sending uses chunking to prevent server overload
- Failed sends are logged but don't crash the system

## 📈 Performance Optimization

- Notifications are sent asynchronously via Django Q
- Bulk notifications are processed in chunks of 50
- Database queries are optimized with select_related
- Failed tasks can be retried automatically
