export async function setupPlugin({ config, global, storage }) {
    const {
        run_frequency,
        url,
        include_last_invoked_at,
        http_method,
        headers,
        body,
        initial_last_invoked_at
    } = config
    global.run_frequency = run_frequency
    if (!url.match(/^https?:\/\//)) {
        throw new Error('Invalid url. Supported protocols: HTTP, HTTPS')
    }
    global.url = url
    global.include_last_invoked_at = include_last_invoked_at === 'true'
    if (['GET', 'DELETE'].includes(http_method) && body) {
        throw new Error('HTTP method cannot be GET or DELETE when body is set.')
    }
    global.http_method = http_method
    global.body = body
    if (headers) {
        try {
            const headersObject = JSON.parse(headers)
            global.headers = headersObject
        } catch (error) {
            throw new Error('Headers are not valid JSON.')
        }
    }
    if (initial_last_invoked_at) {
        const initialLastInvokedAt = parseInt(initial_last_invoked_at)
        if (isNaN(initialLastInvokedAt)) {
            throw new Error('initial_last_invoked_at is not a number.')
        }
        await storage.set('last_invoked_at', initialLastInvokedAt)
    } else {
        await storage.set('last_invoked_at', new Date().valueOf())
    }
}

function appendLastInvoked(url, last_invoked_at) {
    return `${url}${url.includes('?') ? '&' : '?'}last_invoked_at=${last_invoked_at}`
}

async function callAPI({ url, include_last_invoked_at, http_method: method, headers = {}, body }, last_invoked_at) {
    if (include_last_invoked_at && last_invoked_at !== undefined) {
        url = appendLastInvoked(url, last_invoked_at)
    }
    await fetch(url, {
        method,
        headers,
        body: body || undefined,
    })
}

function logRequest(last_invoked_at) {
    console.log(`Sending request (Last invoked at: ${new Date(last_invoked_at).toISOString()})`)
}

export async function runEveryMinute({ config, global, storage }) {
    if (config.run_frequency !== "minute") {
        return
    }
    const last_invoked_at = await storage.get('last_invoked_at')
    logRequest(last_invoked_at)
    const now = new Date().valueOf()
    await callAPI(global, last_invoked_at)
    await storage.set('last_invoked_at', now)
}

export async function runEveryHour({ config, global, storage }) {
    if (config.run_frequency !== "hour") {
        return
    }
    const last_invoked_at = await storage.get('last_invoked_at')
    logRequest(last_invoked_at)
    const now = new Date().valueOf()
    await callAPI(global, last_invoked_at)
    await storage.set('last_invoked_at', now)
}

export async function runEveryDay({ config, global, storage }) {
    if (config.run_frequency !== "day") {
        return
    }
    const last_invoked_at = await storage.get('last_invoked_at')
    logRequest(last_invoked_at)
    const now = new Date().valueOf()
    await callAPI(global, last_invoked_at)
    await storage.set('last_invoked_at', now)
}
