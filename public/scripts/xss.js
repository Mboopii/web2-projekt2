let sanitizationEnabled = true;

fetch('/get-sanitization-status')
    .then(response => response.json())
    .then(data => {
        sanitizationEnabled = data.sanitizationEnabled;
        const button = document.getElementById('toggleSanitization');
        button.textContent = `Zaštita: ${sanitizationEnabled ? 'ON' : 'OFF'}`;
    })
    .catch(error => console.error('Greška pri dohvaćanju stanja sanitizacije:', error));

function sanitizeInput(input) {
    if (!sanitizationEnabled) return input; 
    
    //znakovi koje treba zamijeniti za zaštitu od XSS napada
    return input.replace(/[&<>"'\/]/g, function (match) {
        switch (match) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            case '/': return '&#47;';
            case '{': return '&#123;';
            case '}': return '&#125;';
            case '`': return '&#96;';
            case '=': return '&#61;';
            case '(': return '&#40;';
            case ')': return '&#41;';
            case ';': return '&#59;';
            case '+': return '&#43;';
            default: return match;
        }        
    });
}

function toggleSanitization() {
    fetch(sanitizationEnabled ? '/disable-sanitization' : '/enable-sanitization', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            sanitizationEnabled = data.sanitizationEnabled;
            const button = document.getElementById('toggleSanitization');
            button.textContent = `Zaštita: ${sanitizationEnabled ? 'ON' : 'OFF'}`;
            location.reload();
        })
        .catch(error => console.error('Greška pri slanju promjene sanitizacije:', error));
}

function addComment() {
    const user_name = document.getElementById('user_name').value.trim();
    const comment = document.getElementById('comment').value.trim();
    const errorMessageElement = document.getElementById('error-message');

    //provjera da korisničko ime i komentar nisu prazni
    if (user_name === '' || comment === '') {
        errorMessageElement.textContent = 'Obavezno je unijeti ime korisnika i komentar!';
        errorMessageElement.style.display = 'block';
        return;
    } else {
        errorMessageElement.style.display = 'none';
    }

    //sanitiziraj korisničko ime i komentar
    const sanitizedUserName = sanitizationEnabled ? sanitizeInput(user_name) : user_name;
    const sanitizedComment = sanitizationEnabled ? sanitizeInput(comment) : comment;

    fetch('/add-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: sanitizedUserName, comment: sanitizedComment })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Komentar je uspješno dodan:', data);
        window.location.reload();
    })
    .catch(error => console.error('Greška pri dodavanju komentara:', error));
}