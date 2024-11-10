function toggleAccessControl(enable) {
    const url = enable ? '/enable-access-control' : '/disable-access-control';
    fetch(url, { method: 'POST' })
        .then(() => location.reload());
}

function loginAs(role) {
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('user-status').textContent = data.role;
    })
    .catch(error => {
        console.error('Greška pri prijavi:', error);
    });
}