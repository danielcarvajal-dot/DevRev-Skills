# Workflow Build Request Handler

## Purpose
When a user says "build me a workflow" (or similar), guide them through
the full process: understand intent → map to nodes → build or guide the
build → deploy and monitor.

---

## Trigger phrases
- "build me a workflow"
- "create a workflow"
- "automate this for me"
- "set up an automation"
- "I want a workflow that..."
- "can you build a workflow for..."

---

## Process

### Step 1 – Understand intent
Ask at most 2 clarifying questions to establish:
- What **event** should trigger the workflow?
  (e.g., ticket created, SLA breached, manual trigger, timer)
- What **action** should happen as a result?
  (e.g., send notification, update a field, create an issue, add a comment)
- Are there **conditions or branching** needed?
  (e.g., only if priority is P0, only if customer is verified)

Default to the most likely interpretation if the request is clear enough.
Do not ask more than 2–3 questions total.

---

### Step 2 – Map to workflow nodes
Select nodes based on use case logic. Available node categories:

**Trigger nodes** (what starts the workflow):
ticket_created, ticket_updated, issue_created, issue_updated,
enhancement_created, enhancement_updated, conversation_created,
conversation_updated, account_created, account_updated,
incident_created, incident_updated, opportunity_created,
opportunity_updated, contact_created, contact_updated,
meeting_created, meeting_updated, timer_trigger, manual_trigger,
api_trigger, ai_agent_skill_trigger, nudge_buttons_clicked,
workspace_created, timeline_comment_created, dm_created_or_updated,
ticket_sla_tracker_updated, issue_sla_tracker_updated,
conversation_sla_tracker_updated, csat_response_received,
question_answer_created, question_answer_updated,
article_created, dev_user_created, dev_user_updated,
airdrop_sync_run_started, airdrop_sync_run_status_updated,
widget_created, widget_updated, invoice_created, invoice_updated,
meeting_linked_with_object, ticket_linked_with_object,
issue_linked_with_object

**Action nodes** (what the workflow does):
create_ticket, update_ticket, create_issue, update_issue,
create_contact, update_contact, create_account, update_account,
create_incident, update_incident, create_opportunity,
update_opportunity, create_meeting, update_meeting,
create_article, update_article, update_enhancement,
update_conversation, update_question_answer, add_comment,
send_notification, create_dm, convert_conversation_to_ticket,
link_ticket_with_issue, link_issue_with_issue,
link_incident_with_issue, link_incident_with_ticket,
link_meeting_with_ticket, link_conversation_with_ticket,
pick_user, get_ticket, get_issue, get_account, get_customer,
get_org_user, get_self, get_incident, get_opportunity,
get_meeting, get_workspace, get_part, get_enhancement,
get_feature, get_brand, get_conversation, get_time,
get_metric_trackers, list_issues, list_enhancements, list_sprint,
loop_over_tickets, loop_over_issues, loop_over_enhancements,
loop_over_opportunity, loop_over_meetings, loop_over_articles,
loop_over_customers, loop_over_dev_users,
loop_over_objects_linked_to_issue, loop_over_objects_linked_to_ticket,
loop_over_objects_linked_to_opportunity,
loop_over_objects_linked_to_enhancement,
list_objects_linked_to_issue, list_objects_linked_to_ticket,
oasis_sql_execute, execute_analytics_job, execute_code, run_code,
http, mcp, hybrid_search, fetch_object_context,
query_artifact_content, extract_content,
knowledge_store_index, knowledge_store_deindex,
agent_knowledge_fetch, devrev_airdrop_retriever,
get_airdrop_sync_unit, personalize_widget,
execute_metric_action, send_form, ask_options,
watch_ticket_for_updates, object_spam_checker,
evaluate_sentiment, suggest_part, classify_object,
agent_callback, agent_retriever_callback,
set_ai_agent_skill_output, ai_agent_skill,
get_complete_enhancement_details, get_tool_metadata,
get_org_user_preference, create_brand, update_brand,
create_dm, create_opportunity

**Control nodes** (logic and flow):
if_else, for_each, while, go_back, sleep_for, sleep_until,
init_variable, set_variable, echo, agent_callback,
talk_to_agent, ask_agent, ai_feedback

**AI nodes** (intelligence layer):
ask_ai, classify_object, evaluate_sentiment,
object_spam_checker, suggest_part, ask_agent,
talk_to_agent, ai_agent_skill

**Delay nodes**:
sleep_for, sleep_until, timer_trigger

---

### Step 3 – Build or guide the build

**Use Workflow Builder UI when:**
- The process has 3+ sequential steps
- Branching logic (if/else) is needed
- External integrations are required
- Delays or scheduled follow-ups are needed
- Error handling and retry logic is needed

**Handle directly (no builder needed) when:**
- A single API call suffices
- The action is a simple CRUD operation
- The agent can decide the action at runtime
- The task is fully unstructured

**To access Workflow Builder:**
Settings → Workflow Builder → Create New Workflow → add nodes on canvas

---

### Step 4 – Handle edge cases
- If the request is ambiguous, ask at most 2–3 clarifying questions
- Suggest the closest matching workflow pattern
- If engineering help is needed, offer to create an internal support
  ticket routed to the Skill and Workflow Builder CAPL
  (L2 owner: Yukta Goel)

---

### Step 5 – Deploy and monitor
- Deploy the workflow from the builder
- Monitor execution via the **Runs tab** (step-by-step history,
  inputs/outputs per node, error states)
- Validation errors surface before deployment — fix issues while
  building, not after

---

## Use case quick reference

| Use case | Best nodes |
|---|---|
| Event-driven automation | Trigger nodes (ticket_created, issue_updated, etc.) |
| Scheduled automation | timer_trigger, sleep_for, sleep_until |
| Conditional logic | if_else, while |
| Batch processing | for_each, loop_over_* nodes |
| External integrations | http, mcp, api_trigger, run_code |
| AI & intelligence | ask_ai, classify_object, evaluate_sentiment |
| User interaction | ask_options, talk_to_agent, send_form |
| Data operations | oasis_sql_execute, get_*, list_*, hybrid_search |

---

## Escalation path
If the user needs to file a bug or request for workflow/agent issues:
- **Skill and Workflow Builder CAPL** → owner: Yukta Goel (L2 Support)
- **Computer Workspace CAPL** → owner: Yukta Goel (L2 Support)
- **Computer For Customers CAPL** → owner: R Sunandita (L2 Support)
- **Agent Platform CAPL** → owner: R Sunandita or Yukta Goel (L2 Support)

Always ask when creating a ticket:
1. Which org was the workflow in?
2. What is the workflow ID?
3. When did it happen?
