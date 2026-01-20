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
    
    const data = loadQuestions();
    if (!data) return;
    
    const { uploadBatchId, questions } = data;
    const formData = new FormData(event.target);
    
    // Build responses array
    const responses = questions.map((question, index) => {
        return {
            issue_key: question.issue_key,
            question: question.question,
