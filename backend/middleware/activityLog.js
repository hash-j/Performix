const pool = require('../config/database');

/**
 * Log an activity to the database
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action (user_added, client_added, etc.)
 * @param {string} entityType - Type of entity (user, client, team_member, etc.)
 * @param {string} entityId - ID of the entity being acted upon
 * @param {string} entityName - Name of the entity
 * @param {string} tabName - Name of the tab being edited (optional)
 * @param {string} description - Description of the activity
 */
async function logActivity(userId, actionType, entityType, entityId, entityName, tabName, description) {
    try {
        console.log(`[Activity Log] Logging: ${actionType} - ${entityType}: ${entityName} (User: ${userId})`);
        
        const result = await pool.query(
            `INSERT INTO activity_log (user_id, action_type, entity_type, entity_id, entity_name, tab_name, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [userId, actionType, entityType, entityId, entityName, tabName || null, description]
        );
        
        console.log(`[Activity Log] ✓ Logged successfully - ID: ${result.rows[0].id}`);
    } catch (error) {
        console.error('[Activity Log] ✗ Error logging activity:', error.message);
        console.error('[Activity Log] Details:', {
            userId,
            actionType,
            entityType,
            entityId,
            entityName,
            tabName,
            description: description.substring(0, 50) + '...'
        });
        // Don't throw - activity logging should not break the main operation
    }
}

/**
 * Middleware to attach logging function to request
 */
function activityLoggerMiddleware(req, res, next) {
    req.logActivity = logActivity;
    next();
}

module.exports = {
    logActivity,
    activityLoggerMiddleware
};
