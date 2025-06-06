const API_URL = window.location.protocol + '//' + 'localhost:3002';

function showMessage(message, isError = false) {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) return;
    
    messageContainer.innerHTML = '';
    const alertDiv = document.createElement('div');
    alertDiv.className = isError ? 'alert alert-danger' : 'alert alert-success';
    alertDiv.textContent = message;
    messageContainer.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transition = 'opacity 1s';
        setTimeout(() => messageContainer.innerHTML = '', 1000);
    }, 5000);
}

async function fetchAPI(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Ocorreu um erro na requisição');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTodayFormatted() {
    return formatDate(new Date());
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página inicializada. API URL: ' + API_URL);
});
