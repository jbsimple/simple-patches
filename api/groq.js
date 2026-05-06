export default async function handler(req, res) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map(o => o.trim())
        .filter(Boolean);
    const origin = req.headers.origin;
    if (!origin || !allowedOrigins.includes(origin)) { return res.status(403).json({ success: false, error: "Origin not allowed" }); }

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") { return res.status(200).end(); }
    if (req.method !== "POST") { return res.status(405).json({ success: false, error: "Method not allowed" }); }

    const referrerHeader = req.headers.referer || req.headers.origin;
    if (!referrerHeader) { return res.status(403).json({ success: false, error: "Missing referrer" }); }

    let hostname;
    try {
        hostname = new URL(referrerHeader).hostname;
    } catch {
        return res.status(400).json({ success: false, error: "Invalid referrer" });
    }

    const token = process.env.groq_free;

    if (!token) { return res.status(500).json({ success: false, error: "Missing API token" }); }

    const allowedModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'];

    const requestedModel = req.query.model;
    const model = allowedModels.includes(requestedModel) ? requestedModel : 'llama-3.3-70b-versatile';
    const prompt = req.body?.prompt;

    if (!prompt || typeof prompt !== 'string') { return res.status(400).json({ success: false, error: "No Prompt Provided" }); }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                model,
                error: data
            });
        }

        const output = data?.choices?.[0]?.message?.content || "";

        return res.status(200).json({
            success: true,
            model,
            response: output,
            usage: data.usage || null
        });

    } catch (err) {
        console.error("GROQ ERROR:", err);

        return res.status(500).json({
            success: false,
            model,
            error: err.message || "Unknown error"
        });
    }
}