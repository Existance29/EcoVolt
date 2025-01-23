const sql = require("mssql"); 
const dbConfig = require("../database/dbConfig");

class course {


    static async startCourse(course_id, user_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                INSERT INTO user_courses (user_id, course_id, started_at, completed_at, progress_percentage)
                VALUES (@user_id, @course_id, GETDATE(), NULL, 0);
            `;
            const request = connection.request();
            request.input('user_id', user_id);
            request.input('course_id', course_id);
            const result = await request.query(sqlQuery);
            return result.rowsAffected > 0;
        } catch (error) {
            console.error(error);
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async completeCourse(user_id, course_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                UPDATE user_courses
                SET completed_at = GETDATE()
                WHERE user_id = @user_id AND course_id = @course_id;
            `;
            const request = connection.request();
            request.input('user_id', user_id);
            request.input('course_id', course_id);
            const result = await request.query(sqlQuery);
            return result.rowsAffected > 0;
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
            const sqlQuery = `
                SELECT * FROM courses
            `;
            const request = connection.request();
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error(error);
            return [];
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async getCourseByIdForContentPage(course_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT 
                    courses.id AS course_id,
                    courses.title AS course_title,
                    courses.description AS course_description,
                    courses.points AS course_points,
                    courses.image_path AS course_image_path,
                    lessons.id AS lesson_id,
                    lessons.course_id AS lesson_course_id,
                    lessons.title AS lesson_title,
                    lessons.content AS lesson_content,
                    lessons.duration AS lesson_duration,
                    lessons.position AS lesson_position,
                    lessons.video_link AS lesson_video_link
                FROM 
                    courses 
                INNER JOIN 
                    lessons 
                ON 
                    courses.id = lessons.course_id 
                WHERE 
                    courses.id = @course_id;
            `;
            const request = connection.request();
            request.input('course_id', course_id);
            const result = await request.query(sqlQuery);
            return result.recordset;
        } catch (error) {
            console.error(error);
            return [];
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }

    static async getUserProgress(user_id, course_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
    
            const sqlQuery = `
                SELECT 
                    (
                        CAST(COUNT(ul.lesson_id) AS FLOAT) / CAST(COUNT(l.id) AS FLOAT) * 100
                    ) AS progress_percentage
                FROM 
                    lessons l
                LEFT JOIN 
                    user_lessons ul 
                    ON l.id = ul.lesson_id AND ul.user_id = @user_id
                WHERE 
                    l.course_id = @course_id
                    AND (ul.lesson_id IS NOT NULL OR l.id != (SELECT MAX(id) FROM lessons WHERE course_id = @course_id))
                GROUP BY 
                    l.course_id;
            `;
    
            const request = connection.request();
            request.input('user_id', user_id);
            request.input('course_id', course_id);
    
            const result = await request.query(sqlQuery);
            return Math.floor(result.recordset[0]?.progress_percentage || 0); // Default to 0% if no progress
        } catch (error) {
            console.error(error);
            return 0;
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }
    
    

    static async getLastLessonForUser(user_id, course_id) {
        let connection;
        try {
            connection = await sql.connect(dbConfig);
            const sqlQuery = `
                SELECT 
                    l.id AS lesson_id,
                    l.title AS lesson_title,
                    l.position AS lesson_position
                FROM 
                    lessons l
                LEFT JOIN 
                    user_lessons ul 
                ON 
                    l.id = ul.lesson_id AND ul.user_id = @user_id
                WHERE 
                    l.course_id = @course_id
                ORDER BY 
                    ul.completed_at DESC, -- Most recently completed lesson
                    l.position ASC;       -- If no completion, return the first lesson in order
            `;
            const request = connection.request();
            request.input("user_id", user_id);
            request.input("course_id", course_id);
            const result = await request.query(sqlQuery);
    
            // Return the first lesson in the result (either last completed or next in order)
            return result.recordset[0] || null;
        } catch (error) {
            console.error("Error fetching the last lesson:", error);
            return null;
        } finally {
            if (connection) {
                connection.close();
            }
        }
    }
    

// ------------------------------- lesson related below 

//-- helper
static async getLessonByCourseIdAndLessonId(course_id, lesson_id) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const sqlQuery = `
            SELECT * FROM lessons WHERE course_id = @course_id AND id = @lesson_id
        `;
        const request = connection.request();
        request.input("course_id", course_id);
        request.input("lesson_id", lesson_id);
        const result = await request.query(sqlQuery);
        return result.recordset[0];
    } catch (error) {
        console.error(error);
        return null;
    } finally {
        if (connection) {
            connection.close();
        }
    }
}

static async getLessonById(course_id, lesson_id) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);

        // Fetch lesson details
        const lessonQuery = `
            SELECT 
                lessons.id AS lesson_id,
                lessons.course_id AS lesson_course_id,
                lessons.title AS lesson_title,
                lessons.content AS lesson_content,
                lessons.duration AS lesson_duration,
                lessons.position AS lesson_position,
                lessons.video_link AS lesson_video_link
            FROM 
                lessons
            WHERE 
                lessons.id = @lesson_id AND 
                lessons.course_id = @course_id;
        `;
        const lessonRequest = connection.request();
        lessonRequest.input("course_id", course_id);
        lessonRequest.input("lesson_id", lesson_id);
        const lessonResult = await lessonRequest.query(lessonQuery);

        // Fetch key concepts
        const conceptsQuery = `
            SELECT 
                key_concepts.id AS concept_id,
                key_concepts.lesson_id AS concept_lesson_id,
                key_concepts.title AS concept_title,
                key_concepts.description AS concept_description
            FROM 
                key_concepts
            WHERE 
                key_concepts.lesson_id = @lesson_id;
        `;
        const conceptsResult = await connection.request()
            .input("lesson_id", lesson_id)
            .query(conceptsQuery);

        // Fetch questions
        const questionsQuery = `
            SELECT 
                questions.id AS question_id,
                questions.lesson_id AS question_lesson_id,
                questions.question_text AS question_text,
                questions.option_a AS question_option_a,
                questions.option_b AS question_option_b,
                questions.option_c AS question_option_c,
                questions.option_d AS question_option_d,
                questions.correct_option AS question_correct_option
            FROM 
                questions
            WHERE 
                questions.lesson_id = @lesson_id;
        `;
        const questionsResult = await connection.request()
            .input("lesson_id", lesson_id)
            .query(questionsQuery);

        // Combine data into a single object
        const lessonData = {
            ...lessonResult.recordset[0],
            key_concepts: conceptsResult.recordset,
            questions: questionsResult.recordset
        };

        return lessonData;
    } catch (error) {
        console.error("Error fetching lesson:", error);
        return null;
    } finally {
        if (connection) {
            connection.close();
        }
    }
}


static async increaseUserProgress(user_id, course_id, lesson_id) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);

        // Check if the lesson is already marked as completed
        const checkLessonQuery = `
            SELECT 1
            FROM user_lessons
            WHERE user_id = @user_id AND lesson_id = @lesson_id
        `;
        const checkRequest = connection.request();
        checkRequest.input("user_id", user_id);
        checkRequest.input("lesson_id", lesson_id);
        const checkResult = await checkRequest.query(checkLessonQuery);

        // If the lesson is already completed, return current progress
        if (checkResult.recordset.length > 0) {
            const currentProgress = await this.getUserProgress(user_id, course_id);
            return currentProgress;
        }

        // Mark the lesson as completed
        const markLessonQuery = `
            INSERT INTO user_lessons (user_id, lesson_id)
            VALUES (@user_id, @lesson_id)
        `;
        await connection.request()
            .input("user_id", user_id)
            .input("lesson_id", lesson_id)
            .query(markLessonQuery);

        // Calculate progress percentage
        const progressQuery = `
            SELECT 
                (CAST(COUNT(ul.lesson_id) AS FLOAT) / CAST(COUNT(l.id) AS FLOAT)) * 100 AS progress_percentage
            FROM lessons l
            LEFT JOIN user_lessons ul ON l.id = ul.lesson_id AND ul.user_id = @user_id
            WHERE l.course_id = @course_id
            GROUP BY l.course_id
        `;
        const progressResult = await connection.request()
            .input("user_id", user_id)
            .input("course_id", course_id)
            .query(progressQuery);

        const progressPercentage = Math.round(progressResult.recordset[0]?.progress_percentage || 0);

        // Update the user's progress in the user_courses table
        const updateProgressQuery = `
            UPDATE user_courses
            SET progress_percentage = @progress_percentage
            WHERE user_id = @user_id AND course_id = @course_id
        `;
        await connection.request()
            .input("user_id", user_id)
            .input("course_id", course_id)
            .input("progress_percentage", progressPercentage)
            .query(updateProgressQuery);

        return progressPercentage;
    } catch (error) {
        console.error("Error increasing user progress:", error);
        throw error;
    } finally {
        if (connection) {
            connection.close();
        }
    }
}






// ---------------- for rewarding points
static async getUserPoints(user_id) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT total_points
            FROM user_rewards
            WHERE user_id = @user_id
        `;
        const result = await connection.request()
            .input("user_id", user_id)            
            .query(query);

        return result.recordset[0]?.total_points || 0;
    } catch (error) {
        console.error("Error fetching user points:", error);
        throw error;
    } finally {
        if (connection) {
            connection.close();
        }
    }
}

static async checkIfActivityExists(user_id, activityType) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT 1
            FROM activity_points
            WHERE user_id = @user_id AND activity_type = @activityType
        `;
        const result = await connection.request()
            .input("user_id", user_id)
            .input("activityType", activityType)
            .query(query);

        return result.recordset.length > 0;
    } catch (error) {
        console.error("Error checking activity existence:", error);
        throw error;
    } finally {
        if (connection) {
            connection.close();
        }
    }
}
static async checkIfUserExistsInRewards(user_id) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT 1
            FROM user_rewards
            WHERE user_id = @user_id
        `;
        const result = await connection.request()
            .input("user_id", user_id)
            .query(query);

        return result.recordset.length > 0;
    } catch (error) {
        console.error("Error checking user in rewards table:", error);
        throw error;
    } finally {
        if (connection) {
            connection.close();
        }
    }
}
static async addUserToRewards(user_id, points) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            INSERT INTO user_rewards (user_id, total_points)
            VALUES (@user_id, @points)
        `;
        await connection.request()
            .input("user_id", user_id)
            .input("points", points)
            .query(query);
    } catch (error) {
        console.error("Error adding user to rewards table:", error);
        throw error;
    } finally {
        if (connection) {
            connection.close();
        }
    }
}
static async updateUserPoints(user_id, points) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            UPDATE user_rewards
            SET total_points = total_points + @points
            WHERE user_id = @user_id
        `;
        await connection.request()
            .input("user_id", user_id)
            .input("points", points)
            .query(query);
    } catch (error) {
        console.error("Error updating user points:", error);
        throw error;
    } finally {
        if (connection) {
            connection.close();
        }
    }
}
static async logActivityPoints(user_id, post_id, activityType, points) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            INSERT INTO activity_points (user_id, post_id, activity_type, points_awarded, datetime)
            VALUES (@user_id, @post_id, @activityType, @points, GETDATE())
        `;
        await connection.request()
            .input("user_id", user_id)
            .input("post_id", post_id) // Set to `null` if not applicable
            .input("activityType", activityType)
            .input("points", points)
            .query(query);
    } catch (error) {
        console.error("Error logging activity points:", error);
        throw error;
    } finally {
        if (connection) {
            connection.close();
        }
    }
}


static async getCoursesCompleted(user_id) {
    let connection;
    try {
        connection = await sql.connect(dbConfig);
        const query = `
            SELECT user_courses.user_id, courses.title, courses.points, courses.description, courses.image_path, user_courses.completed_at
            FROM user_courses
            INNER JOIN courses ON user_courses.course_id = courses.id
            WHERE user_courses.user_id = @user_id;
        `;
        const result = await connection.request()
            .input("user_id", user_id)
            .query(query);
        return result.recordset;
    } catch (error) {
        console.error("Error fetching completed courses:", error);
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
    

}

module.exports = course;