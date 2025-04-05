/**
 * Questions functionality for practice pages and NGN examples
 */

// Global variables
let currentQuestionIndex = 0;
let questions = [];
let userAnswers = [];
let examType = 'exam1'; // Default to standard exam
let examTitle = 'NCLEX Practice Exam';
let examDescription = 'Practice with traditional NCLEX-style questions covering essential nursing knowledge.';

/**
 * Initialize the practice exam functionality
 */
function initializePracticeExam() {
    // Get elements
    const startExamBtn = document.getElementById('start-exam-btn');
    const exitExamBtn = document.getElementById('exit-exam-btn');
    const prevQuestionBtn = document.getElementById('prev-question-btn');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const showAnswerBtn = document.getElementById('show-answer-btn');
    const reviewExamBtn = document.getElementById('review-exam-btn');
    
    // Set up event listeners
    if (startExamBtn) {
        startExamBtn.addEventListener('click', function() {
            document.getElementById('exam-intro').classList.add('hidden');
            document.getElementById('exam-container').classList.remove('hidden');
            displayQuestion(0);
        });
    }
    
    if (exitExamBtn) {
        exitExamBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to exit the exam? Your progress will be saved.')) {
                showExamResults();
            }
        });
    }
    
    if (prevQuestionBtn) {
        prevQuestionBtn.addEventListener('click', function() {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                displayQuestion(currentQuestionIndex);
            }
        });
    }
    
    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', function() {
            // Save the current answer if one is selected
            saveCurrentAnswer();
            
            // Hide the rationale if it's visible
            document.getElementById('rationale-container').classList.add('hidden');
            
            // Check if we're at the last question
            if (currentQuestionIndex < questions.length - 1) {
                currentQuestionIndex++;
                displayQuestion(currentQuestionIndex);
            } else {
                // End the exam
                showExamResults();
            }
        });
    }
    
    if (showAnswerBtn) {
        showAnswerBtn.addEventListener('click', function() {
            showAnswerRationale(currentQuestionIndex);
        });
    }
    
    if (reviewExamBtn) {
        reviewExamBtn.addEventListener('click', function() {
            const reviewContainer = document.getElementById('question-review');
            if (reviewContainer.classList.contains('hidden')) {
                reviewContainer.classList.remove('hidden');
                generateQuestionReview();
            } else {
                reviewContainer.classList.add('hidden');
            }
        });
    }
}

/**
 * Setup the exam questions based on the exam type
 * @param {string} type - The type of exam to load
 */
function setupExamQuestions(type) {
    // Set the exam type
    examType = type;
    
    // Set exam title and description based on type
    if (type === 'exam1') {
        examTitle = 'NCLEX Practice Exam';
        examDescription = 'Practice with traditional NCLEX-style questions covering essential nursing knowledge.';
    } else if (type === 'exam2') {
        examTitle = 'Next Generation NCLEX Practice';
        examDescription = 'Master the new NGN question formats focusing on clinical judgment.';
    }
    
    // Update the UI with exam information
    document.getElementById('exam-title').textContent = examTitle;
    document.getElementById('exam-title-nav').textContent = examTitle;
    document.getElementById('exam-description').textContent = examDescription;
    
    // Fetch the questions from the appropriate JSON file
    fetch(`../data/practice-questions.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load questions. Please try again later.');
            }
            return response.json();
        })
        .then(data => {
            if (!data[examType]) {
                throw new Error('No questions available for this exam type. Please try a different exam.');
            }
            
            // Extract exam information and items
            const examData = data[examType];
            
            // Set updated exam information from the data if available
            if (examData.title) document.getElementById('exam-title').textContent = examData.title;
            if (examData.title) document.getElementById('exam-title-nav').textContent = examData.title;
            if (examData.description) document.getElementById('exam-description').textContent = examData.description;
            
            // Get questions from the items array
            questions = examData.items || [];
            
            // If no questions found, show an error
            if (questions.length === 0) {
                document.getElementById('exam-description').textContent = 'No questions available for this exam type. Please try a different exam.';
                document.getElementById('start-exam-btn').disabled = true;
                console.error('No questions found for exam type:', examType);
                return;
            }
            
            // Get user-selected question count (default to 10)
            let questionCount = 10;
            // Check if question count is specified in local storage
            const storedQuestionCount = localStorage.getItem('nclexQuestionCount');
            if (storedQuestionCount) {
                questionCount = parseInt(storedQuestionCount);
            }
            
            // Prepare for the exam with specified number of questions
            if (questions.length > questionCount) {
                // Randomly select the specified number of questions
                questions = questions.sort(() => 0.5 - Math.random()).slice(0, questionCount);
            }
            
            // Initialize user answers array
            userAnswers = Array(questions.length).fill(null);
            
            // Update question count in the UI
            document.getElementById('question-number').textContent = `Question 1 of ${questions.length}`;
        })
        .catch(error => {
            console.error('Error loading questions:', error);
            document.getElementById('exam-description').textContent = 'Error loading questions. Please try again later.';
            document.getElementById('start-exam-btn').disabled = true;
        });
}

/**
 * Display a specific question
 * @param {number} index - The index of the question to display
 */
function displayQuestion(index) {
    // Update navigation buttons
    document.getElementById('prev-question-btn').disabled = index === 0;
    document.getElementById('next-question-btn').textContent = index === questions.length - 1 ? 'Finish Exam' : 'Next';
    
    // Update question number
    document.getElementById('question-number').textContent = `Question ${index + 1} of ${questions.length}`;
    
    // Get the question
    const question = questions[index];
    
    // Show question stem (text)
    document.getElementById('question-stem').textContent = question.text || question.stem || '';
    
    // Clear options container
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // Determine question type (single-select or multi-select)
    const isMultiSelect = question.questionType === 'multi-select';
    
    // Get the options (choices or options)
    const options = question.choices || question.options || [];
    
    // Add options based on question type
    if (options.length > 0) {
        options.forEach((option, optionIndex) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.dataset.index = optionIndex;
            
            // Check if this option was previously selected
            const userAnswer = userAnswers[index];
            if (userAnswer !== null) {
                if (isMultiSelect && Array.isArray(userAnswer)) {
                    if (userAnswer.includes(optionIndex)) {
                        optionElement.classList.add('selected');
                    }
                } else if (userAnswer === optionIndex) {
                    optionElement.classList.add('selected');
                }
            }
            
            // Create option marker (A, B, C, etc.)
            const markerElement = document.createElement('div');
            markerElement.className = 'option-marker';
            markerElement.textContent = String.fromCharCode(65 + optionIndex); // A, B, C, etc.
            
            // Create option text
            const textElement = document.createElement('div');
            textElement.className = 'option-text';
            textElement.textContent = option;
            
            // Add elements to option
            optionElement.appendChild(markerElement);
            optionElement.appendChild(textElement);
            
            // Add click event listener
            optionElement.addEventListener('click', function() {
                if (isMultiSelect) {
                    // For multi-select, toggle selection
                    this.classList.toggle('selected');
                } else {
                    // For single-select, remove selection from all options and select this one
                    document.querySelectorAll('.option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    this.classList.add('selected');
                }
            });
            
            // Add to options container
            optionsContainer.appendChild(optionElement);
        });
    }
    
    // If this is a multi-select question, add a note
    if (isMultiSelect) {
        const noteElement = document.createElement('div');
        noteElement.className = 'mt-3 mb-3';
        noteElement.innerHTML = '<strong>Note:</strong> This is a multi-select question. Select all options that apply.';
        optionsContainer.prepend(noteElement);
    }
    
    // Hide the rationale container if it's visible
    document.getElementById('rationale-container').classList.add('hidden');
    
    // Set current question index
    currentQuestionIndex = index;
}

/**
 * Save the user's answer for the current question
 */
function saveCurrentAnswer() {
    const selectedOptions = document.querySelectorAll('.option.selected');
    const question = questions[currentQuestionIndex];
    const isMultiSelect = question.questionType === 'multi-select';
    
    if (selectedOptions.length > 0) {
        if (isMultiSelect) {
            // For multi-select, save an array of selected indices
            userAnswers[currentQuestionIndex] = Array.from(selectedOptions).map(opt => 
                parseInt(opt.dataset.index)
            );
        } else {
            // For single-select, save the index of the selected option
            userAnswers[currentQuestionIndex] = parseInt(selectedOptions[0].dataset.index);
        }
    } else {
        // No selection made
        userAnswers[currentQuestionIndex] = null;
    }
}

/**
 * Show the answer rationale for a question
 * @param {number} index - The index of the question
 */
function showAnswerRationale(index) {
    const question = questions[index];
    const rationale = question.rationale || "No rationale available for this question.";
    // Check for different answer field names (correctAnswer or answer)
    const correctAnswer = question.correctAnswer !== undefined ? question.correctAnswer : question.answer;
    
    // Save the current answer
    saveCurrentAnswer();
    
    // Display the rationale
    document.getElementById('rationale-text').textContent = rationale;
    document.getElementById('rationale-container').classList.remove('hidden');
    
    // Highlight correct answer(s)
    const options = document.querySelectorAll('.option');
    options.forEach(option => {
        const optionIndex = parseInt(option.dataset.index);
        option.classList.remove('correct');
        
        // Check if this option is correct
        if (Array.isArray(correctAnswer)) {
            // For multi-select questions
            if (correctAnswer.includes(optionIndex)) {
                option.classList.add('correct');
            }
        } else {
            // For single-select questions
            if (correctAnswer === optionIndex) {
                option.classList.add('correct');
            }
        }
    });
}

/**
 * Show the exam results
 */
function showExamResults() {
    // First, save the current answer
    saveCurrentAnswer();
    
    // Calculate the score
    let correctCount = 0;
    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const userAnswer = userAnswers[i];
        // Check for different answer field names (correctAnswer or answer)
        const correctAnswer = question.correctAnswer !== undefined ? question.correctAnswer : question.answer;
        
        // Skip if user didn't answer
        if (userAnswer === null) continue;
        
        // Check if answer is correct
        if (Array.isArray(correctAnswer)) {
            // For multi-select questions
            if (Array.isArray(userAnswer) && 
                userAnswer.length === correctAnswer.length && 
                userAnswer.every(ans => correctAnswer.includes(ans))) {
                correctCount++;
            }
        } else {
            // For single-select questions
            if (userAnswer === correctAnswer) {
                correctCount++;
            }
        }
    }
    
    // Calculate score percentage
    const totalQuestions = questions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    
    // Update results UI
    document.getElementById('result-score').textContent = `${scorePercentage}%`;
    document.getElementById('result-correct').textContent = correctCount;
    document.getElementById('result-total').textContent = totalQuestions;
    document.getElementById('result-message').textContent = getResultMessage(scorePercentage);
    
    // Hide exam container and show results
    document.getElementById('exam-container').classList.add('hidden');
    document.getElementById('results-container').classList.remove('hidden');
    
    // Track exam completion in analytics
    if (typeof trackExamCompletion === 'function') {
        trackExamCompletion(examType, scorePercentage);
    }
}

/**
 * Generate the question review section
 */
function generateQuestionReview() {
    const reviewContainer = document.getElementById('review-questions');
    reviewContainer.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionReview = document.createElement('div');
        questionReview.className = 'question-container mt-4';
        
        // Question header
        const questionHeader = document.createElement('div');
        questionHeader.innerHTML = `<h4>Question ${index + 1}</h4>`;
        
        // Question stem/text
        const questionStem = document.createElement('p');
        questionStem.className = 'question-stem';
        questionStem.textContent = question.text || question.stem || '';
        
        // Options
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';
        
        // Check for different answer field names (correctAnswer or answer)
        const correctAnswer = question.correctAnswer !== undefined ? question.correctAnswer : question.answer;
        
        // Add options
        const options = question.choices || question.options || [];
        if (options.length > 0) {
            options.forEach((option, optionIndex) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';
                
                // Check if this is the correct answer
                if (Array.isArray(correctAnswer)) {
                    if (correctAnswer.includes(optionIndex)) {
                        optionElement.classList.add('correct');
                    }
                } else if (correctAnswer === optionIndex) {
                    optionElement.classList.add('correct');
                }
                
                // Check if user selected this option
                const userAnswer = userAnswers[index];
                if (userAnswer !== null) {
                    if (Array.isArray(userAnswer) && userAnswer.includes(optionIndex)) {
                        optionElement.classList.add('selected');
                    } else if (userAnswer === optionIndex) {
                        optionElement.classList.add('selected');
                    }
                }
                
                // Create option marker
                const markerElement = document.createElement('div');
                markerElement.className = 'option-marker';
                markerElement.textContent = String.fromCharCode(65 + optionIndex); // A, B, C, etc.
                
                // Create option text
                const textElement = document.createElement('div');
                textElement.className = 'option-text';
                textElement.textContent = option;
                
                // Add elements to option
                optionElement.appendChild(markerElement);
                optionElement.appendChild(textElement);
                
                // Add to options container
                optionsContainer.appendChild(optionElement);
            });
        }
        
        // Rationale
        const rationaleContainer = document.createElement('div');
        rationaleContainer.className = 'answer-rationale';
        rationaleContainer.innerHTML = `
            <h3>Rationale</h3>
            <p>${question.rationale || "No rationale available for this question."}</p>
        `;
        
        // Build the question review
        questionReview.appendChild(questionHeader);
        questionReview.appendChild(questionStem);
        questionReview.appendChild(optionsContainer);
        questionReview.appendChild(rationaleContainer);
        
        // Add to review container
        reviewContainer.appendChild(questionReview);
    });
}

/**
 * Get a message based on the exam score
 * @param {number} score - The exam score
 * @returns {string} - A message based on the score
 */
function getResultMessage(score) {
    if (score >= 90) {
        return "Excellent! You're well-prepared for the NCLEX exam. Keep up the great work!";
    } else if (score >= 80) {
        return "Great job! You have a strong understanding of the material. Focus on the questions you missed to become even stronger.";
    } else if (score >= 70) {
        return "Good work! You're on the right track. Review the areas where you had difficulty to improve your score.";
    } else if (score >= 60) {
        return "You're making progress. Focus on understanding the rationales for the questions you missed and continue practicing.";
    } else {
        return "Don't worry! This is a learning opportunity. Review the rationales carefully and consider focusing on content review in addition to practice questions.";
    }
}

/**
 * Initialize NGN Examples
 */
function initializeNGNExamples() {
    // Show NGN examples section when the button is clicked
    const showNGNExamplesBtn = document.getElementById('show-ngn-examples-btn');
    if (showNGNExamplesBtn) {
        showNGNExamplesBtn.addEventListener('click', function() {
            document.getElementById('simulator-intro').classList.add('hidden');
            document.getElementById('ngn-examples').classList.remove('hidden');
            setupNGNInteractiveExamples();
        });
    }
    
    // Return to simulator when back button is clicked
    const backToSimulatorBtn = document.getElementById('back-to-simulator-btn');
    if (backToSimulatorBtn) {
        backToSimulatorBtn.addEventListener('click', function() {
            document.getElementById('ngn-examples').classList.add('hidden');
            document.getElementById('simulator-intro').classList.remove('hidden');
        });
    }
}

/**
 * Setup interactive examples for NGN question types
 */
function setupNGNInteractiveExamples() {
    // Load example data from JSON
    fetch('../data/ngn-info.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load NGN examples. Please try again later.');
            }
            return response.json();
        })
        .then(data => {
            // Set up each example type
            setupMatrixExample(data.matrixExample);
            setupClozeExample(data.clozeExample);
            setupHighlightingExample(data.highlightingExample);
            setupDragAndDropExample(data.dragDropExample);
        })
        .catch(error => {
            console.error('Error loading NGN examples:', error);
            document.querySelectorAll('.ngn-example-container').forEach(container => {
                container.innerHTML = '<p>Error loading example. Please try again later.</p>';
            });
        });
}

/**
 * Setup matrix example
 * @param {Object} data - Matrix example data
 */
function setupMatrixExample(data = null) {
    const container = document.getElementById('matrix-example');
    if (!container) return;
    
    // If no data provided, use default example
    if (!data) {
        data = {
            question: "For each client condition, select whether the nursing action is appropriate or not appropriate.",
            rows: ["Client with asthma exacerbation", "Client with diabetic ketoacidosis", "Client with acute myocardial infarction"],
            columns: ["Administer oxygen via nasal cannula", "Apply ice to affected area", "Position in high Fowler's"],
            answer: [[true, false, true], [true, false, false], [true, false, false]]
        };
    }
    
    // Create matrix example HTML
    let html = `
        <p>${data.question}</p>
        <table class="matrix-table">
            <thead>
                <tr>
                    <th></th>
    `;
    
    // Add column headers
    data.columns.forEach(column => {
        html += `<th>${column}</th>`;
    });
    
    html += `
                </tr>
            </thead>
            <tbody>
    `;
    
    // Add rows
    data.rows.forEach((row, rowIndex) => {
        html += `
            <tr>
                <th>${row}</th>
        `;
        
        // Add cells
        data.columns.forEach((_, colIndex) => {
            html += `
                <td>
                    <input type="checkbox" class="matrix-cell-checkbox" data-row="${rowIndex}" data-col="${colIndex}">
                </td>
            `;
        });
        
        html += `
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    // Set container HTML
    container.innerHTML = html;
    
    // Add event listeners to checkboxes
    const checkboxes = container.querySelectorAll('.matrix-cell-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const row = parseInt(this.dataset.row);
            const col = parseInt(this.dataset.col);
            
            // Check if answer is correct
            if (data.answer && data.answer[row] && data.answer[row][col] === this.checked) {
                this.parentElement.style.backgroundColor = 'rgba(163, 255, 147, 0.3)'; // Light green
            } else {
                this.parentElement.style.backgroundColor = 'rgba(255, 77, 77, 0.3)'; // Light red
            }
        });
    });
}

/**
 * Setup cloze (dropdown) example
 * @param {Object} data - Cloze example data
 */
function setupClozeExample(data = null) {
    const container = document.getElementById('cloze-example');
    if (!container) return;
    
    // If no data provided, use default example
    if (!data) {
        data = {
            text: "A nurse is caring for a client with heart failure who has been prescribed furosemide (Lasix). The client's serum potassium level is 3.2 mEq/L. The nurse should [DROPDOWN1] administration of this medication and expect to [DROPDOWN2] potassium supplement.",
            dropdowns: [
                {
                    id: "DROPDOWN1",
                    options: ["proceed with", "hold", "decrease", "increase"],
                    answer: 1
                },
                {
                    id: "DROPDOWN2",
                    options: ["administer a", "hold the", "decrease the", "continue with the current"],
                    answer: 0
                }
            ]
        };
    }
    
    // Process text to add dropdowns
    let processedText = data.text;
    data.dropdowns.forEach(dropdown => {
        const selectHtml = `
            <select class="cloze-dropdown" data-answer="${dropdown.answer}">
                <option value="">Select...</option>
                ${dropdown.options.map((option, index) => `<option value="${index}">${option}</option>`).join('')}
            </select>
        `;
        processedText = processedText.replace(`[${dropdown.id}]`, selectHtml);
    });
    
    // Set container HTML
    container.innerHTML = `
        <div class="cloze-text">
            ${processedText}
        </div>
    `;
    
    // Add event listeners to dropdowns
    const dropdowns = container.querySelectorAll('.cloze-dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('change', function() {
            const selectedValue = parseInt(this.value);
            const correctAnswer = parseInt(this.dataset.answer);
            
            if (selectedValue === correctAnswer) {
                this.style.backgroundColor = 'rgba(163, 255, 147, 0.7)'; // Green
            } else {
                this.style.backgroundColor = 'rgba(255, 77, 77, 0.7)'; // Red
            }
        });
    });
}

/**
 * Setup highlighting example
 * @param {Object} data - Highlighting example data
 */
function setupHighlightingExample(data = null) {
    const container = document.getElementById('highlighting-example');
    if (!container) return;
    
    // If no data provided, use default example
    if (!data) {
        data = {
            instruction: "Highlight all abnormal assessment findings in the passage below:",
            text: "A nurse is assessing a client who was admitted with pneumonia. The client's vital signs are: temperature 102.4°F, heart rate 110 bpm, respiratory rate 28 breaths per minute, and blood pressure 110/70 mmHg. Breath sounds reveal crackles in the right lower lobe. The client reports a productive cough with yellow-green sputum and rates their pain as 2/10.",
            highlights: ["temperature 102.4°F", "heart rate 110 bpm", "respiratory rate 28 breaths per minute", "crackles in the right lower lobe", "productive cough with yellow-green sputum"]
        };
    }
    
    // Set container HTML
    container.innerHTML = `
        <div>
            <p>${data.instruction}</p>
            <div class="highlight-text" id="highlight-text-area">
                ${data.text}
            </div>
            <button id="check-highlights-btn" class="neubtn secondary mt-3">Check Highlights</button>
        </div>
    `;
    
    // Set up highlighting functionality
    const textArea = document.getElementById('highlight-text-area');
    
    // Make text selectable for highlighting
    textArea.addEventListener('mouseup', function() {
        const selection = window.getSelection();
        if (selection.toString().length > 0) {
            // Create a span to wrap the selected text
            const range = selection.getRangeAt(0);
            const selectedText = selection.toString();
            
            // Check if the selection is already highlighted
            if (range.startContainer.parentNode.classList && 
                range.startContainer.parentNode.classList.contains('highlight-active')) {
                // Remove highlight
                const highlightSpan = range.startContainer.parentNode;
                const textNode = document.createTextNode(highlightSpan.textContent);
                highlightSpan.parentNode.replaceChild(textNode, highlightSpan);
            } else {
                // Add highlight
                const span = document.createElement('span');
                span.classList.add('highlight-active');
                span.textContent = selectedText;
                range.deleteContents();
                range.insertNode(span);
            }
            
            // Clear selection
            selection.removeAllRanges();
        }
    });
    
    // Add event listener to check button
    const checkBtn = document.getElementById('check-highlights-btn');
    if (checkBtn) {
        checkBtn.addEventListener('click', function() {
            // Get all highlighted spans
            const highlightedSpans = textArea.querySelectorAll('.highlight-active');
            const highlightedTexts = Array.from(highlightedSpans).map(span => span.textContent);
            
            // Check against correct highlights
            let correctCount = 0;
            highlightedTexts.forEach(text => {
                if (data.highlights.some(highlight => text.includes(highlight))) {
                    correctCount++;
                }
            });
            
            // Calculate score
            const totalCorrect = data.highlights.length;
            const userHighlighted = highlightedTexts.length;
            const falsePositives = userHighlighted - correctCount;
            
            // Show result
            alert(`You correctly identified ${correctCount} out of ${totalCorrect} abnormal findings.\n${falsePositives > 0 ? `You also highlighted ${falsePositives} normal findings.` : ''}`);
        });
    }
}

/**
 * Setup drag and drop example
 * @param {Object} data - Drag and drop example data
 */
function setupDragAndDropExample(data = null) {
    const container = document.getElementById('drag-drop-example');
    if (!container) return;
    
    // If no data provided, use default example
    if (!data) {
        data = {
            instruction: "Drag the nursing interventions to the appropriate priority level for a client with acute respiratory distress:",
            items: [
                "Administer prescribed oxygen",
                "Assess respiratory rate and oxygen saturation",
                "Document client response to interventions",
                "Position client in high Fowler's position",
                "Notify healthcare provider of changes",
                "Prepare for possible intubation"
            ],
            categories: [
                {
                    name: "Highest Priority",
                    correctItems: ["Assess respiratory rate and oxygen saturation", "Administer prescribed oxygen"]
                },
                {
                    name: "Moderate Priority",
                    correctItems: ["Position client in high Fowler's position", "Notify healthcare provider of changes"]
                },
                {
                    name: "Lowest Priority",
                    correctItems: ["Document client response to interventions", "Prepare for possible intubation"]
                }
            ]
        };
    }
    
    // Set container HTML
    container.innerHTML = `
        <div class="drag-drop-container">
            <p>${data.instruction}</p>
            
            <div class="drag-area">
                <h4>Nursing Interventions</h4>
                <div class="draggable-items" id="drag-items">
                    ${data.items.map(item => `<div class="draggable-item" draggable="true">${item}</div>`).join('')}
                </div>
            </div>
            
            <div class="drop-zones">
                ${data.categories.map(category => `
                    <div class="drop-zone" data-category="${category.name}">
                        <div class="drop-zone-title">${category.name}</div>
                        <div class="drop-zone-items"></div>
                    </div>
                `).join('')}
            </div>
            
            <button id="check-drag-drop-btn" class="neubtn secondary mt-3">Check Answers</button>
        </div>
    `;
    
    // Set up drag and drop functionality
    const draggableItems = container.querySelectorAll('.draggable-item');
    const dropZones = container.querySelectorAll('.drop-zone');
    
    // Add event listeners to draggable items
    draggableItems.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.textContent);
            this.classList.add('dragging');
        });
        
        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
        });
    });
    
    // Add event listeners to drop zones
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const itemText = e.dataTransfer.getData('text/plain');
            const draggedItem = document.querySelector(`.draggable-item:not(.dropped):contains('${itemText}')`);
            
            if (draggedItem) {
                // Clone the item and add to drop zone
                const clone = draggedItem.cloneNode(true);
                clone.classList.add('dropped');
                clone.setAttribute('draggable', 'false');
                
                // Add remove button
                const removeBtn = document.createElement('span');
                removeBtn.innerHTML = '&times;';
                removeBtn.classList.add('remove-item');
                removeBtn.addEventListener('click', function() {
                    clone.remove();
                });
                
                clone.appendChild(removeBtn);
                this.querySelector('.drop-zone-items').appendChild(clone);
                
                // Hide original
                draggedItem.classList.add('dropped');
                draggedItem.style.display = 'none';
            }
        });
    });
    
    // Add event listener to check button
    const checkBtn = document.getElementById('check-drag-drop-btn');
    if (checkBtn) {
        checkBtn.addEventListener('click', function() {
            let totalCorrect = 0;
            let totalItems = 0;
            
            // Check each drop zone
            dropZones.forEach(zone => {
                const category = zone.dataset.category;
                const correctItems = data.categories.find(c => c.name === category).correctItems;
                const droppedItems = Array.from(zone.querySelectorAll('.dropped')).map(item => item.textContent.replace('×', '').trim());
                
                // Count correct items
                droppedItems.forEach(item => {
                    if (correctItems.includes(item)) {
                        totalCorrect++;
                    }
                });
                
                totalItems += droppedItems.length;
            });
            
            // Show result
            alert(`You correctly placed ${totalCorrect} out of ${totalItems} items.`);
        });
    }
}

// Add a contains selector for older browsers
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}
