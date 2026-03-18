const urlRegex = /(https?:\/\/[^\s]+)/g

const fetchPreview = async (url) => {
    try {
        const response = await fetch(`/api/preview?url=${encodeURIComponent(url)}`)
        if (!response.ok) return null

        const html = await response.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')

        const get = (selector, attr = 'content') =>
            doc.querySelector(selector)?.getAttribute(attr) || null

        return {
            title: get('meta[property="og:title"]') || doc.title || null,
            description: get('meta[property="og:description"]'),
            image: get('meta[property="og:image"]'),
            url,
        }
    } catch {
        return null
    }
}

const buildPreview = (data) => {
    if (!data || (!data.title && !data.image)) return null

    const template = document.getElementById('preview-template')
    const preview = template.content.cloneNode(true).querySelector('.preview')

    preview.href = data.url

    const img = preview.querySelector('img')
    if (data.image) {
        img.src = data.image
        img.onerror = () => img.style.display = 'none'
    } else {
        img.style.display = 'none'
    }

    preview.querySelector('.preview-title').textContent = data.title || ''
    preview.querySelector('.preview-description').textContent = data.description || ''
    preview.querySelector('.preview-url').textContent = data.url

    return preview
}

const getMessages = async( ) => {
    const response = await fetch(`/api/messages`)
    const messages = await response.json()
    
    const ul = document.getElementById(`messages`)
    ul.innerHTML = ''

    for (let i = 0; i < messages.length; i++) {
        const message = messages[i]
        const li = document.createElement('li')
        li.innerHTML = `<strong>${message.user}:</strong> ${message.text}`
        if (message.user === 'usuario'){
            li.classList.add('me')
        } else {
            li.classList.add('other')
        }

        ul.append(li)
        const urls = message.text.match(urlRegex)
        if (urls) {
            fetchPreview(urls[0]).then((data) => {
                const preview = buildPreview(data)
                if (preview) li.append(preview)
            })
        }
    }

}

const postMessage = async(message) => {
    await fetch(`/api/messages`, {
        method: 'POST',
        body: JSON.stringify(message),
    })
    getMessages()
}


getMessages()
setInterval(getMessages, 10000)

document.getElementById('send').addEventListener('click', () => {
    const message = document.getElementById('message').value
    postMessage({
    user: 'usuario',
    text: message
    })
    input.value = ''
})


document.getElementById('message').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const message = document.getElementById('message').value
        postMessage({
            user: 'usuario',
            text: message
        })
        input.value = ''
    }
})