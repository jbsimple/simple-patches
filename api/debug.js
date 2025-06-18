export default async function handler(req, res) {
    const password = req.headers['x-upload-password'];
    const correct = process.env.UPLOAD_SECRET;

    return res.status(200).json({
        message: 'Debug mode',
        receivedPassword: password,
        expectedSecret: correct || 'undefined'
    });
}