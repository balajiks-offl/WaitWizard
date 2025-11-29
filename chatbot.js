const ICONS = {
  "Take a Ticket": "fa-ticket",
  "Track Ticket": "fa-location-dot",
  "Swap Ticket": "fa-arrows-rotate",
  "Cancel Ticket": "fa-ban",
  "Chatbot": "fa-robot",
  "History": "fa-scroll",
  "Notifications": "fa-bell"
};

const faqs = {
  "Take a Ticket": {
    questions: ["How do I book a ticket?", "What information do I need to provide?", "Can I book multiple tickets?"],
    answers: {
      "How do I book a ticket?": "Go to 'Take a Ticket', pick your appointment time and submit.",
      "What information do I need to provide?": "Provide your name, contact number, and appointment details.",
      "Can I book multiple tickets?": "Only one ticket per appointment is allowed."
    }
  },
  "Track Ticket": {
    questions: ["How can I check the status of my ticket?", "How do I know how long until my turn?"],
    answers: {
      "How can I check the status of my ticket?": "Visit 'Track Ticket' and enter your ticket ID.",
      "How do I know how long until my turn?": "System updates your position and wait time in real-time."
    }
  },
  "Swap Ticket": {
    questions: ["Can I swap my ticket with someone else?", "How does the swapping process work?"],
    answers: {
      "Can I swap my ticket with someone else?": "Yes, you can exchange queue positions with another user.",
      "How does the swapping process work?": "Submit a swap request; once approved, tickets update instantly."
    }
  },
  "Cancel Ticket": {
    questions: ["How do I cancel my ticket?", "What happens if I cancel my ticket?"],
    answers: {
      "How do I cancel my ticket?": "Go to 'Cancel Ticket' and confirm cancellation.",
      "What happens if I cancel my ticket?": "Your ticket is voided and removed from the queue."
    }
  },
  "History": {
    questions: ["How can I see my previous tickets?", "Where is my queue history stored?"],
    answers: {
      "How can I see my previous tickets?": "Open 'History' to view all past tickets.",
      "Where is my queue history stored?": "Stored securely in your system profile."
    }
  },
  "Notifications": {
    questions: ["Will I get reminders?", "How will I receive notifications?"],
    answers: {
      "Will I get reminders?": "Yes, automatic reminders are sent.",
      "How will I receive notifications?": "Through the system and optional SMS/Email."
    }
  }
};

const chatHeader = document.getElementById("chat-header");
const selectionContainer = document.getElementById("selection-container");
const answerContainer = document.getElementById("answer-container");
const answerHeader = document.getElementById("answer-header");
const answerContent = document.getElementById("answer-content");
const backToTopicsBtn = document.getElementById("back-to-topics");

let currentTopic = null, currentQuestion = null;

function createRipple(e, btn) {
  const ripple = document.createElement('span');
  ripple.className = 'rippling';
  btn.appendChild(ripple);
  setTimeout(() => btn.removeChild(ripple), 580);
}

function showSelection(items, onClickCallback) {
  selectionContainer.innerHTML = "";
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "card-btn";

    let iconClass = "fa-robot"; 
    if (ICONS[item]) iconClass = ICONS[item];

    const ic = document.createElement("span");
    ic.className = `card-icon fa-solid ${iconClass}`;
    btn.appendChild(ic);

    btn.appendChild(document.createTextNode(item));
    btn.onclick = function(e) {
      createRipple(e, btn);
      onClickCallback(item);
    };
    selectionContainer.appendChild(btn);
  });
}

const modes = ["FAQ", "Chatbot"];
function showLanding() {
  chatHeader.innerHTML = `<span class="avatar"><i class="fa-solid fa-robot"></i></span><span>Welcome - Choose Mode</span>`;
  backToTopicsBtn.style.display = "none";
  showSelection(modes, handleModeSelect);
  clearAnswer("Please select a mode first.");
}

function handleModeSelect(mode) {
  selectionContainer.classList.add("slide-out-left");
  setTimeout(() => {
    selectionContainer.classList.remove("slide-out-left");
    if (mode === "FAQ") showTopics();
    else if (mode === "Chatbot") showChatbotMode();
  }, 400);
}

function showTopics() {
  currentTopic = null;
  chatHeader.innerHTML = `<span class="avatar"><i class="fa-solid fa-robot"></i></span><span>FAQ Topics</span>`;
  backToTopicsBtn.style.display = "inline-block";
  showSelection(Object.keys(faqs), showQuestions);
  clearAnswer("Please select a topic to view questions.");
}
function showQuestions(topic) {
  currentTopic = topic;
  chatHeader.innerHTML = `<span class="avatar"><i class="fa-solid ${ICONS[topic]||'fa-robot'}"></i></span><span>FAQ - ${topic}</span>`;
  backToTopicsBtn.style.display = "inline-block";
  showSelection(faqs[topic].questions, showAnswer);
  clearAnswer("Please select a question.");
}
function showAnswer(question) {
  currentQuestion = question;
  answerHeader.textContent = question;
  answerContent.textContent = faqs[currentTopic].answers[question];
  answerContainer.classList.add("visible");
}

function showChatbotMode() {
  chatHeader.innerHTML = `<span class="avatar"><i class="fa-solid fa-comments"></i></span><span>Chatbot</span>`;
  backToTopicsBtn.style.display = "inline-block";
  selectionContainer.innerHTML = `<div class="chat-placeholder"><i class="fa-solid fa-robot"></i> Hello! How can I assist you today?</div>`;
  answerHeader.textContent = "Chatbot Mode";
  answerContent.textContent = "This is where chatbot interactions will appear.";
  answerContainer.classList.add("visible");
}

function clearAnswer(msg="Please select an option") {
  answerHeader.textContent = "";
  answerContent.textContent = msg;
  answerContainer.classList.remove("visible");
}

backToTopicsBtn.onclick = () => {
  showLanding();
};

showLanding();
