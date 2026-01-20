// Parse URL parameters
function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        uploadBatchId: params.get('upload_batch_id'),
        questionsJSON: params.get('questions')
    };
}

// Decode and parse questions
function loadQuestions() {
    const urlParams = getURLParams();
    
    if (!urlParams.uploadBatchId || !urlParams.questionsJSON) {
        showError('Lien invalide. Veuillez utiliser le lien reçu par email.');
        return null;
    }
    
    try {
        const questions = JSON.parse(decodeURIComponent(urlParams.questionsJSON));
        return { 
            uploadBatchId: urlParams.uploadBatchId, 
            questions: questions 
        };
    } catch (error) {
        console.error('Parse error:', error);
        showError('Erreur de chargement des questions. Veuillez contacter BRIGADIA.');
        return null;
    }
}

// Generate form fields dynamically
function generateForm(questions) {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    
    questions.forEach(function(question, index) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.setAttribute('for', 'question_' + index);
        label.textContent = (index + 1) + '. ' + question.question;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'question_' + index;
        input.name = 'question_' + index;
        input.required = true;
        input.dataset.issueKey = question.issue_key;
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        container.appendChild(formGroup);
    });
}

// Handle form submission
function handleSubmit(event) {
    event.preventDefault();
    
    const data = loadQuestions();
    if (!data) {
        return;
    }
    
    const uploadBatchId = data.uploadBatchId;
    const questions = data.questions;
    const formData = new FormData(event.target);
    
    // Build responses array
    const responses = [];
    for (let i = 0; i < questions.length; i++) {
        responses.push({
            issue_key: questions[i].issue_key,
            question: questions[i].question,
            resolved_value: formData.get('question_' + i)
        });
    }
    
    // Prepare payload
    const payload = {
        upload_batch_id: uploadBatchId,
        responses: responses
    };
    
    // Submit to webhook
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours...';
    
    const webhookURL = 'https://marguerite.app.n8n.cloud/webhook/menu-review-responses';
    
    fetch(webhookURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(function(response) {
        if (response.ok) {
            showSuccess();
        } else {
            throw new Error('Erreur serveur');
        }
    })
    .catch(function(error) {
        console.error('Submit error:', error);
        showError('Erreur lors de l\'envoi. Veuillez réessayer.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer mes réponses';
    });
}

// Show success message
function showSuccess() {
    document.getElementById('reviewForm').style.display = 'none';
    document.getElementById('successMessage').style.display = 'block';
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const data = loadQuestions();
    
    if (data) {
        generateForm(data.questions);
        document.getElementById('reviewForm').addEventListener('submit', handleSubmit);
    } else {
        document.getElementById('reviewForm').style.display = 'none';
    }
});
