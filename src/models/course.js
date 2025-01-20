const sql = require("mssql"); 
const dbConfig = require("../database/dbConfig");

class course {

    static async getCourseById(course_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `SELECT * FROM courses WHERE id = @course_id`;
            const request = connection.request();
            request.input('course_id', course_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async getAllCourses() {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `SELECT * FROM courses`;
            const request = connection.request();
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async getLessonsByCourseId(course_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `SELECT * FROM lessons WHERE course_id = @course_id`;
            const request = connection.request();
            request.input('course_id', course_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }




    static async getNextLesson(lesson_id, course_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT * FROM lessons WHERE course_id = @course_id AND id > @lesson_id ORDER BY id ASC
            `;
            const request = connection.request();
            request.input('course_id', course_id);
            request.input('lesson_id', lesson_id);
            const result = await request.query(sqlQuery);
            return result.recordset[0];
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async getLessonDurationByCourseId(course_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `SELECT duration FROM lessons WHERE course_id = @course_id`;
            const request = connection.request();
            request.input('course_id', course_id);
            const result = await request.query(sqlQuery);
            return result.recordset[0];  
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async lessonCount(course_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            SELECT id 
            FROM lessons 
            WHERE course_id = @course_id
            ORDER BY position ASC;
            `;
            const request = connection.request();
            request.input('course_id', course_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async getVideoLink(lesson_id, course_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            select * from lessons where id = @lesson_id AND course_id = @course_id
            `;
            const request = connection.request();
            request.input('lesson_id', lesson_id);
            request.input('course_id', course_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async getQuestionsByLessonId(lesson_id, course_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
            select * from lessons inner join questions on 
            lessons.id = questions.lesson_id where lessons.id = @lesson_id AND lessons.course_id = @course_id
            `;
            const request = connection.request();
            request.input('lesson_id', lesson_id);
            request.input('course_id', course_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async getKeyConceptsByLessonId(lesson_id) {
        let connection;
        try {
          connection = await sql.connect(dbConfig);
          const sqlQuery = `
            SELECT key_concepts.title, key_concepts.description
            FROM key_concepts
            INNER JOIN lessons ON key_concepts.lesson_id = lessons.id
            WHERE lessons.id = @lesson_id
          `;
      
          const request = connection.request();
          request.input("lesson_id", sql.Int, lesson_id); // Ensure parameter type is sql.Int
          const result = await request.query(sqlQuery);
          return result.recordset;
        } catch (error) {
          console.error("Database error:", error);
          throw error; // Re-throw the error for the controller to handle
        } finally {
          if (connection) {
            connection.close();
          }
        }
      }
      

    static async checkUserRewards(user_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `SELECT * FROM user_rewards WHERE user_id = @user_id`;
            const request = connection.request();
            request.input('user_id', user_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async addPoints(userId, points) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                INSERT INTO user_rewards (user_id, total_points) 
                VALUES (@id, @points)
            `;
            const request = connection.request();
            request.input('id', userId);
            request.input('points', points);
            const result = await request.query(sqlQuery);
            return result;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async updatePoints(userId, points) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `UPDATE user_rewards SET total_points = @points WHERE user_id = @id`;
            const request = connection.request();
            request.input('id', userId);
            request.input('points', points);
            const result = await request.query(sqlQuery);
            return result;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }
    
    static async logActivity(user_id, post_id = null, activity_type, points_awarded, datetime) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                INSERT INTO activity_points (user_id, post_id, activity_type, points_awarded, datetime)
                VALUES (@user_id, @post_id, @activity_type, @points_awarded, @datetime)
            `;
            const request = connection.request();
            request.input('user_id', user_id);
            request.input('post_id', post_id);
            request.input('activity_type', activity_type);
            request.input('points_awarded', points_awarded);
            request.input('datetime', datetime);
            const result = await request.query(sqlQuery);
            return result.rowsAffected; // Return rows affected as a result
        } catch (error) {
            console.error("Error in logActivity:", error);
            throw error;
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async submitSuggestion(user_id, company_id, title, suggestion_text, created_at, status) {
        let connection;
        try {
            // Connect to the database
            connection = await sql.connect(dbConfig);
    
            // SQL query for inserting the suggestion
            const sqlQuery = `
                INSERT INTO suggestions (user_id, company_id, title, suggestion_text, created_at, status)
                VALUES (@user_id, @company_id, @title, @suggestion_text, @created_at, @status)
            `;
    
            // Create a request and add input parameters
            const request = connection.request();
            request.input('user_id', sql.Int, user_id);
            request.input('company_id', sql.Int, company_id);
            request.input('title', sql.VarChar(255), title);
            request.input('suggestion_text', sql.Text, suggestion_text);
            request.input('created_at', sql.DateTime, created_at);
            request.input('status', sql.VarChar(50), status);
    
            // Execute the query
            await request.query(sqlQuery);
        } catch (error) {
            console.error("Error in submitSuggestion:", error);
            throw error; // Re-throw the error for the controller to handle
        } finally {
            if (connection) {
                connection.close(); // Close the database connection
            }
        }
    }    
    
    static async checkActivityPoints(user_id, activity_type) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT * FROM activity_points WHERE user_id = @user_id AND activity_type = @activity_type
            `;
            const request = connection.request();
            request.input('user_id', user_id);
            request.input('activity_type', activity_type);
            const result = await request.query(sqlQuery);
            return result.recordset.length > 0;
        } catch (error) {
            console.error("Error in checkActivityPoints:", error);
            throw error;
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async checkUser (user_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `SELECT * FROM users WHERE id = @user_id`;
            const request = connection.request();
            request.input('user_id', user_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

}

module.exports = course;