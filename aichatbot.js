// AI Assistant Widget - Floating Bubble

document.addEventListener("DOMContentLoaded", function () {
    createAIWidget();
    initN8nChat();
});

async function initN8nChat() {
    try {
        const module = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js');
        if (module && module.createChat) {
            module.createChat({
                webhookUrl: 'https://n8ngc.codeblazar.org/webhook/7a06a102-41d2-4040-bf21-f864a122b53a/chat'
            });
        }
    } catch (e) {
        console.error('Failed to load n8n chat:', e);
    }
}

function createAIWidget() {
    var widget = document.createElement("div");

    widget.innerHTML = `
        <button id="aiToggleButton" onclick="toggleAIChat()" title="AI Assistant">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        </button>

        <div id="aiChatBox">
            <div id="aiHeader">
                <span>Ask RP AI</span>
                <button onclick="toggleAIChat()" title="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div id="aiMessages">
                <div class="ai-message">
                    Hello! I can help you with invoices, payments, overdue status and AR reports.
                </div>
            </div>

            <div id="aiInputArea">
                <input id="aiUserInput" type="text" placeholder="Ask me something...">
                <button onclick="sendAIMessage()">Send</button>
            </div>
        </div>
    `;

    document.body.appendChild(widget);
}

function toggleAIChat() {
    var chatBox = document.getElementById("aiChatBox");

    if (chatBox.style.display === "block") {
        chatBox.style.display = "none";
    } else {
        chatBox.style.display = "block";
    }
}

function sendAIMessage() {
    var input = document.getElementById("aiUserInput");
    var message = input.value;

    if (message.trim() === "") {
        return;
    }

    addAIMessage("You", message, "user-message");

    var reply = getAIReply(message);
    addAIMessage("AI", reply, "ai-message");

    input.value = "";
}

function addAIMessage(sender, text, className) {
    var messages = document.getElementById("aiMessages");

    var messageDiv = document.createElement("div");
    messageDiv.className = className;
    messageDiv.innerHTML = "<strong>" + sender + ":</strong><br>" + text;

    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

function getAIReply(userMessage) {
    var message = userMessage.toLowerCase();

    if (message.includes("overdue")) {
        return "Overdue means the customer has not paid after the due date.";
    } 
    else if (message.includes("paid")) {
        return "Paid means the customer has fully completed the invoice payment.";
    } 
    else if (message.includes("unpaid")) {
        return "Unpaid means the customer has not made any payment yet.";
    } 
    else if (message.includes("installment") || message.includes("partial")) {
        return "Installment or partial payment means the customer has paid part of the invoice, but there is still balance remaining.";
    } 
    else if (message.includes("receivable") || message.includes("ar")) {
        return "Accounts Receivable tracks money owed by customers to the company.";
    } 
    else if (message.includes("report")) {
        return "Reports help summarise total receivables, overdue amount, customer balances and ageing analysis.";
    } 
    else if (message.includes("invoice")) {
        return "An invoice is a document requesting payment from a customer for goods or services.";
    } 
    else {
        return "I can help explain invoices, paid, unpaid, installment, overdue, AR reports and customer balances.";
    }
}