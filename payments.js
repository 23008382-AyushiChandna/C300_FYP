let payments = [];

function addPayment() {
    const invoiceNo = document.getElementById("invoiceNo").value;
    const amountPaid = parseFloat(document.getElementById("amountPaid").value);
    const paymentDate = document.getElementById("paymentDate").value;

    if (!invoiceNo || !amountPaid || !paymentDate) {
        alert("Please fill all fields");
        return;
    }

    payments.push({
        invoiceNo,
        amountPaid,
        paymentDate
    });

    updatePaymentTable();
    alert("Payment recorded successfully!");
}

function updatePaymentTable() {
    const table = document.getElementById("paymentTable");
    table.innerHTML = "";

    payments.forEach(p => {
        table.innerHTML += `
            <tr>
                <td>${p.invoiceNo}</td>
                <td>$${p.amountPaid.toLocaleString()}</td>
                <td>${p.paymentDate}</td>
            </tr>
        `;
    });
}