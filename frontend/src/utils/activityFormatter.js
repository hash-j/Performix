// Format relative time for activities
export const formatActivityTime = (timestamp) => {
  const now = new Date();
  const created = new Date(timestamp);
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return created.toLocaleDateString();
};

// Format activity description based on action and entity type
export const formatActivityDescription = (activity) => {
  const action = activity.action_type;
  const entity = activity.entity_name;
  const user = activity.user_name || 'Unknown User';
  const tab = activity.tab_name;

  if (action === 'user_added') {
    return `${user} added new user: ${entity}`;
  } else if (action === 'user_edited') {
    return `${user} edited user: ${entity}`;
  } else if (action === 'client_added') {
    return `${user} added new client: ${entity}`;
  } else if (action === 'client_edited') {
    return `${user} edited client: ${entity}`;
  } else if (action === 'team_member_added') {
    return `${user} added new team member: ${entity}`;
  } else if (action === 'team_member_edited') {
    return `${user} edited team member: ${entity}`;
  } else if (action === 'data_added') {
    const tabDisplay = tab ? ` in ${tab}` : '';
    return `${user} added ${activity.entity_type} data for ${entity}${tabDisplay}`;
  } else if (action === 'data_edited') {
    const tabDisplay = tab ? ` in ${tab}` : '';
    return `${user} edited ${activity.entity_type} data for ${entity}${tabDisplay}`;
  }
  return activity.description || `${user} performed an action`;
};
