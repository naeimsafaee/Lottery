const jwt = require('jsonwebtoken');
const Client = model('Client');


module.exports.login = async (req, res, next) => {

    const token = req.header('x-auth-token');
    if (!token)
        return res.status(401).send('Access denied.');

    try {

        let client = jwt.verify(token, 'jwt-client');

        client = await Client.findById(client._id);

        if(!client)
            return res.status(403).send('Invalid token.');

        req.user = client;

        next();
    } catch (exception) {
        return res.status(403).send('Invalid token.');
    }
}
