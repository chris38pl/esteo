// docs\features\estimate-request.md
# Estimate Request


## Goal
Allow potential customers to submit structured estimate requests that can be automatically transformed into AI-generated estimate drafts.

## User Flow
Customer Fills form
↓
Optionally check with AI
↓
Customer submits request
↓
Request saved in database
↓
AI estimate generation job triggered
↓
Request status changes to processing
↓
Estimate draft generated
↓
Request status changes to completed


## Fields

Add placeholders it selected language.

### Customer Data
- name
- surname
- email
- telephone

### Address
- address
- city
- postalCode
- voivodeship

### Workspace specific fields (if industry = Construction Building)
- propertyType
- preferredStartDate

### Project Details
- description
- attachments

Industry-specific fields depend on workspace business type.
The form should support dynamic field configuration in the future.

## Validation Rules

- description minimum 20 characters
- maximum 10 attachments
- maximum total upload size: 10MB
- email must be valid
- phone number required

## AI Behavior

The AI assistant analyzes:
- missing information
- unclear scope
- incomplete project details

The response must:
- return structured output
- return maximum 5 suggestions
- return array of strings
- never return markdown

## Statuses

Internal status values:
- pending
- processing
- completed
- failed

Localized labels should be displayed in UI.
Internal enum values must remain stable.

## UI Requirements


### Desktop
- Two-column layout

#### Left column
- Marketing image
- Product description
- Benefits list

#### Right column
- Estimate request form

### Mobile
- Single column layout
- Form displayed first

Attachments should provide good UX on smaller screens.

Two buttons:
- Send
- Check with AI

## Technical Notes

## Future Improvements


## Attachments

Supported file types:
- images
- PDF
- DOCX

Constraints:
- maximum 10 files
- maximum total size: 10MB


## Edge Cases

- upload failure
- AI generation failure
- invalid attachments
- rate limit exceeded
- empty AI suggestions

## Security

- Rate limiting required
- CAPTCHA required
- Upload validation required
- AI usage limits required


## Dictionary for workspace (type = construction business)
### Type of property

For construction business (it will be only business for MVP)
- Mieszkanie
- Dom
- Biuro
- Lokal Usługowy
- Inne

### Start date

For construction business
- As soon as possible
- 1 to 3 months
- 3 - 6 months
- 6 to 12 months
- Elastic




