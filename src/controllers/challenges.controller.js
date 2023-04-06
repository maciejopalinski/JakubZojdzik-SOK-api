const pool = require('../services/db.service');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

async function isSolved(usrId, challId) {
    dbRes = await pool.query('SELECT ($1 = ANY ((SELECT solves FROM users WHERE id=$2 AND verified=true)::int[]))::text', [challId, usrId]);
    if (!dbRes || !dbRes.rows || !dbRes.rows.length) {
        return 'false';
    } else {
        return dbRes.rows[0]['text'];
    }
}

async function isAdmin(usrId) {
    dbRes = await pool.query('SELECT admin FROM users WHERE id=$1 AND verified = true', [usrId]);
    if (!dbRes || !dbRes.rows || !dbRes.rows.length) {
        return false;
    } else {
        return dbRes.rows[0]['admin'];
    }
}

//! Only for testing, remove in production
const getChallenges = (request, response) => {
    pool.query('SELECT * FROM challenges ORDER BY start ASC', (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};

const getCurrentChallenges = (request, response) => {
    pool.query("SELECT * FROM challenges WHERE start <= now() AT TIME ZONE 'CEST' ORDER BY start ASC", (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
};

const getInactiveChallenges = (request, response) => {
    const id = request.body.id;
    if (!id) {
        return response.status(403).send('Not permited!');
    }

    isAdmin(id).then((admin) => {
        if (!admin) {
            return response.status(403).send('Not permited');
        }
        pool.query("SELECT * FROM challenges WHERE start > now() AT TIME ZONE 'CEST' ORDER BY start ASC", (error, results) => {
            if (error) {
                throw error;
            }
            return response.status(200).json(results.rows);
        });
    });
};

const getChallengeById = (request, response) => {
    const challId = request.params['challId'];
    const id = request.body.id;
    isAdmin(id).then((admin) => {
        let tmp = " AND start <= now() AT TIME ZONE 'CEST'";
        if (admin) {
            tmp = '';
        }
        pool.query('SELECT * FROM challenges WHERE id = $1' + tmp, [challId], (error, dbRes) => {
            if (error) {
                throw error;
            }
            if (!dbRes || !dbRes.rows || !dbRes.rows.length) {
                return response.status(400).send('Challenge does not exist');
            } else {
                return response.status(200).send(dbRes.rows[0]);
            }
        });
    });
};

const sendAnswer = (request, response) => {
    const { id, challId, answer } = request.body;
    if (!id) {
        return response.status(403).send('Not permited!');
    }

    isSolved(id, challId).then((v) => {
        if (v == 'true') {
            return response.status(200).send(false);
        }
        pool.query("SELECT * FROM challenges WHERE id=$1 AND start <= now() AT TIME ZONE 'CEST'", [challId], (error, dbRes) => {
            if (error) {
                throw error;
            }
            if (!dbRes || !dbRes.rows || !dbRes.rows.length) {
                return response.status(400).send('Challenge does not exist');
            } else {
                const chall = dbRes.rows[0];

                if (!chall || !chall['answer'] || !chall['points'] || !chall['id']) {
                    return response.status(400).send('Challenge does not exist');
                }

                if (chall['answer'] === answer) {
                    pool.query('UPDATE users SET points=points+$1, solves=array_append(solves,$2) WHERE id=$3 AND verified = true', [chall['points'], chall['id'], id], (error) => {
                        if (error) {
                            throw error;
                        }
                        pool.query('UPDATE challenges SET solves=solves+1', (error) => {
                            if (error) {
                                throw error;
                            }
                            return response.status(200).send(true);
                        });
                    });
                } else {
                    return response.status(200).send(false);
                }
            }
        });
    });
};

const addChallenge = (request, response) => {
    const { id, title, content, author, points, answer, start } = request.body;
    isAdmin(id).then((admin) => {
        if (!admin) {
            return response.status(403).send('You have to be admin');
        }
        pool.query('INSERT INTO challenges (title, content, author, points, answer, start) VALUES ($1, $2, $3, $4, $5, $6)', [title, content, author, points, answer, start], (error) => {
            if (error) {
                throw error;
            }
            response.status(201).send('Challenge added');
        });
    });
};

const removeChallenge = (request, response) => {
    const { id, challId } = request.body;
    console.log(id, challId);
    isAdmin(id).then((admin) => {
        if (!admin) {
            return response.status(403).send('You have to be admin');
        }
        pool.query('DELETE FROM challenges WHERE id=$1', [challId], (error) => {
            if (error) {
                throw error;
            }
            response.status(201).send('Challenge removed');
        });
    });
};

module.exports = {
    getChallenges,
    sendAnswer,
    getChallengeById,
    getInactiveChallenges,
    getCurrentChallenges,
    addChallenge,
    removeChallenge
};