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
    const { uploadBatchId, questionsJSON } = getURLParams();
    
    if (!uploadBatchId || !questionsJSON) {
        showError('Lien invalide. Veuillez utiliser le lien reçu par email.');
        return null;
    }
    
    try {
        const questions = JSON.parse(decodeURIComponent(questionsJSON));
        return { uploadBatchId, questions };
    } catch (error) {
        showError('Erreur de chargement des questions. Veuillez contacter BRIGADIA.');
        return null;
    }
}

// Generate form fields dynamically
function generateForm(questions) {
    const container = document.getElementById('questionsContainer');
    
    questions.forEach((question, index) => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.setAttribute('for', `question_${index}`);
        label.textContent = `${index + 1}. ${question.question}`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `question_${index}`;
        input.name = `question_${index}`;
        input.required = true;
        input.dataset.issueKey = question.issue_key;
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        container.appendChild(formGroup);
    });
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    
    const { uploadBatchId, questions } = getURLParams();
    const formData = new FormData(event.target);
    
    // Build responses array
    const responses = questions.map((question, index) => {
        return {
            issue_key: question.issue_key,
            question: question.question,
            resolved_value: formData.get(`question_${index}`)
        };
    });
    
    // Prepare payload
    const payload = {
        upload_batch_id: uploadBatchId,
        responses: responses
    };
    
    // Submit to webhook
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours...';
    
    try {
        // TODO: Replace with your n8n webhook URL
        const webhookURL = 'WEBHOOK_URL_TO_REPLACE';
        
        const response = await fetch(webhookURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            showSuccess();
        } else {
            throw new Error('Erreur serveur');
        }
    } catch (error) {
        showError('Erreur lors de l\'envoi. Veuillez réessayer.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer mes réponses';
    }
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
