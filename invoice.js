const invoiceState = {
    currentInvoice: {
        invoiceNo: "",
        customer: "",
        invoiceDate: "",
        dueDate: "",
        notes: "",
        gstRate: 0.1,
        items: []
    },
    pagination: {
        currentPage: 1,
        pageSize: 5,
        rows: [],
        filteredRows: []
    }
};

function getElement(selectors, root = document) {
    for (const selector of selectors) {
        const element = root.querySelector(selector);
        if (element) {
            return element;
        }
    }
    return null;
}

function initInvoicePage() {
    invoiceState.sections = {
        list: getElement(["#invoiceListSection", ".invoice-list-section", "#invoice-list", ".invoice-list"]),
        detail: getElement(["#invoiceDetailSection", ".invoice-detail-section", "#invoice-detail", ".invoice-detail"]),
        form: getElement(["#invoiceFormSection", ".invoice-form-section", "#invoice-form", ".invoice-form"]),
    };

    const newInvoiceButton = document.getElementById('newInvoiceButton');
    if (newInvoiceButton) {
        newInvoiceButton.addEventListener('click', () => {
            showInvoiceForm('new');
        });
    }

    const invoiceSearch = document.getElementById('invoiceSearch');
    if (invoiceSearch) {
        invoiceSearch.addEventListener('input', () => {
            invoiceState.pagination.currentPage = 1;
            renderInvoiceList();
        });
    }

    document.body.addEventListener("click", handleDocumentClick);

    if (invoiceState.sections.form) {
        invoiceState.sections.form.addEventListener("input", handleFormInput);
        invoiceState.sections.form.addEventListener("click", handleFormClick);
    }

    if (invoiceState.sections.list) {
        invoiceState.sections.list.addEventListener("click", handleListClick);
    }

    if (invoiceState.sections.detail) {
        invoiceState.sections.detail.addEventListener("click", handleDetailClick);
    }

    showInvoiceList();

    if (window.location.hash === '#new' || new URLSearchParams(window.location.search).get('new') === '1') {
        showInvoiceForm('new');
    }
}

function showInvoiceList() {
    setSectionVisibility("list");
    renderInvoiceList();
}

function showInvoiceDetail() {
    setSectionVisibility("detail");
    renderInvoiceDetail();
}

function showInvoiceForm(mode = "new") {
    if (mode === "new") {
        invoiceState.currentInvoice = {
            invoiceNo: "",
            customer: "",
            invoiceDate: "",
            dueDate: "",
            notes: "",
            gstRate: 0.1,
            items: [{ description: "", qty: 1, unitPrice: 0, amount: 0 }]
        };
    }

    setSectionVisibility("form");
    renderInvoiceForm();
}

function setSectionVisibility(activeSection) {
    Object.keys(invoiceState.sections || {}).forEach(sectionKey => {
        const section = invoiceState.sections[sectionKey];
        if (!section) {
            return;
        }
        section.style.display = sectionKey === activeSection ? "" : "none";
    });
}

function renderInvoiceList() {
    const listSection = invoiceState.sections.list;
    if (!listSection) {
        return;
    }

    const body = getInvoiceTableBody();
    if (!body) {
        return;
    }

    if (invoiceState.pagination.rows.length === 0) {
        invoiceState.pagination.rows = Array.from(body.querySelectorAll("tr"));
    }

    invoiceState.pagination.rows.forEach(row => {
        const viewButton = row.querySelector("[data-action=view], .view-invoice, .view-btn, .view");
        if (viewButton) {
            viewButton.dataset.action = "view";
        }
        const editButton = row.querySelector("[data-action=edit], .edit-invoice, .edit-btn, .edit");
        if (editButton) {
            editButton.dataset.action = "edit";
        }
        const deleteButton = row.querySelector("[data-action=delete], .delete-invoice, .delete-btn, .delete");
        if (deleteButton) {
            deleteButton.dataset.action = "delete";
        }
    });

    applyInvoiceListFilters();
    renderInvoiceListPage();
}

function getInvoiceTableBody() {
    const listSection = invoiceState.sections.list;
    if (!listSection) {
        return null;
    }
    return listSection.querySelector("table.primary-table tbody") || listSection.querySelector("tbody");
}

function applyInvoiceListFilters() {
    const listSection = invoiceState.sections.list;
    const searchInput = document.getElementById("invoiceSearch");
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const activeTab = listSection ? listSection.querySelector(".pill-tab.active") : null;
    const statusFilter = activeTab ? (activeTab.dataset.filter || "all").toLowerCase() : "all";

    invoiceState.pagination.filteredRows = invoiceState.pagination.rows.filter((row) => {
        const cells = Array.from(row.querySelectorAll("td"));
        const invoiceNo = cells[0] ? cells[0].textContent.trim().toLowerCase() : "";
        const customer = cells[1] ? cells[1].textContent.trim().toLowerCase() : "";
        const statusElement = row.querySelector(".badge-status");
        const status = statusElement ? statusElement.textContent.trim().toLowerCase() : "";

        const matchesSearch = !query || invoiceNo.includes(query) || customer.includes(query);
        const matchesStatus = statusFilter === "all" || status.includes(statusFilter);

        return matchesSearch && matchesStatus;
    });
}

function renderInvoiceListPage() {
    const body = getInvoiceTableBody();
    if (!body) {
        return;
    }

    const filteredRows = invoiceState.pagination.filteredRows;
    const pageSize = invoiceState.pagination.pageSize;
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

    if (invoiceState.pagination.currentPage > totalPages) {
        invoiceState.pagination.currentPage = totalPages;
    }
    if (invoiceState.pagination.currentPage < 1) {
        invoiceState.pagination.currentPage = 1;
    }

    const start = (invoiceState.pagination.currentPage - 1) * pageSize;
    const end = start + pageSize;
    const visibleRows = filteredRows.slice(start, end);

    invoiceState.pagination.rows.forEach((row) => {
        row.style.display = "none";
    });
    visibleRows.forEach((row) => {
        row.style.display = "";
    });

    removeEmptyInvoiceRow(body);
    if (filteredRows.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.dataset.emptyRow = "true";
        emptyRow.innerHTML = '<td colspan="11">No invoices found.</td>';
        body.appendChild(emptyRow);
    }

    renderPaginationButtons(totalPages);
}

function removeEmptyInvoiceRow(body) {
    const emptyRows = body.querySelectorAll('tr[data-empty-row="true"]');
    emptyRows.forEach((row) => row.remove());
}

function renderPaginationButtons(totalPages) {
    const listSection = invoiceState.sections.list;
    if (!listSection) {
        return;
    }

    const pagination = listSection.querySelector(".pagination");
    if (!pagination) {
        return;
    }

    let html = `<button class="page-btn" data-page-nav="prev" ${invoiceState.pagination.currentPage === 1 ? "disabled" : ""}>Previous</button>`;

    for (let page = 1; page <= totalPages; page += 1) {
        html += `<button class="page-btn ${page === invoiceState.pagination.currentPage ? "active" : ""}" data-page="${page}">${page}</button>`;
    }

    html += `<button class="page-btn" data-page-nav="next" ${invoiceState.pagination.currentPage === totalPages ? "disabled" : ""}>Next</button>`;
    pagination.innerHTML = html;
}

function renderInvoiceDetail() {
    const detailSection = invoiceState.sections.detail;
    if (!detailSection) {
        return;
    }

    const invoice = invoiceState.currentInvoice;
    setTextContent(detailSection, [".invoice-number", "#invoiceNumber", "[data-field=invoice-no]"], invoice.invoiceNo);
    setTextContent(detailSection, [".customer-name", "#customerName", "[data-field=customer]"] , invoice.customer);
    setTextContent(detailSection, [".invoice-date", "#invoiceDate", "[data-field=invoice-date]"], invoice.invoiceDate);
    setTextContent(detailSection, [".due-date", "#dueDate", "[data-field=due-date]"], invoice.dueDate);
    setTextContent(detailSection, [".invoice-notes", "#notes", "[data-field=notes]"], invoice.notes);

    updateSummaryFields(detailSection, invoice);
}

function renderInvoiceForm() {
    const formSection = invoiceState.sections.form;
    if (!formSection) {
        return;
    }

    const invoice = invoiceState.currentInvoice;
    setInputValue(formSection, ["#invoiceNumber", ".invoice-number", "[name=invoiceNo]"], invoice.invoiceNo);
    setInputValue(formSection, ["#customerName", ".customer-name", "[name=customer]"] , invoice.customer);
    setInputValue(formSection, ["#invoiceDate", ".invoice-date", "[name=invoiceDate]"], invoice.invoiceDate);
    setInputValue(formSection, ["#dueDate", ".due-date", "[name=dueDate]"], invoice.dueDate);
    setInputValue(formSection, ["#notes", ".invoice-notes", "[name=notes]"], invoice.notes);
    setInputValue(formSection, ["#gstRate", ".gst-rate", "[name=gstRate]"], invoice.gstRate * 100);

    renderInvoiceItems();
    recalculateInvoice();
}

function renderInvoiceItems() {
    const formSection = invoiceState.sections.form;
    if (!formSection) {
        return;
    }

    const body = getItemsBody(formSection);
    if (!body) {
        return;
    }

    body.innerHTML = "";
    invoiceState.currentInvoice.items.forEach(item => {
        const row = document.createElement("tr");
        row.className = "invoice-item-row";
        row.innerHTML = `
            <td><input type="text" class="item-description" name="description" value="${escapeHtml(item.description)}" placeholder="Description"></td>
            <td><input type="number" class="item-qty" name="qty" min="0" step="1" value="${item.qty}"></td>
            <td><input type="number" class="item-price" name="unitPrice" min="0" step="0.01" value="${item.unitPrice}"></td>
            <td class="item-amount">${formatMoney(item.amount)}</td>
            <td><button type="button" class="remove-row">Remove</button></td>
        `;
        body.appendChild(row);
    });
}

function getItemsBody(formSection) {
    return formSection.querySelector("#invoiceItemsBody") ||
        formSection.querySelector(".invoice-items tbody") ||
        formSection.querySelector("tbody");
}

function handleDocumentClick(event) {
    const target = event.target.closest("button, a");
    if (!target) {
        return;
    }

    const action = getAction(target);
    if (!action) {
        return;
    }

    event.preventDefault();
    switch (action) {
        case "view":
            openInvoiceDetailFromList(target);
            break;
        case "edit":
            openInvoiceEditFromList(target);
            break;
        case "back":
            showInvoiceList();
            break;
        case "save":
            saveInvoice();
            break;
        case "delete":
            deleteInvoice(target);
            break;
        case "print":
            window.print();
            break;
        case "add-row":
            addInvoiceRow();
            break;
        case "remove-row":
            removeInvoiceRow(target);
            break;
    }
}

function handleListClick(event) {
    const target = event.target.closest("button, a");
    if (!target) {
        return;
    }

    if (target.classList.contains("pill-tab")) {
        event.preventDefault();
        const tabs = invoiceState.sections.list.querySelectorAll(".pill-tab");
        tabs.forEach((tab) => tab.classList.remove("active"));
        target.classList.add("active");
        invoiceState.pagination.currentPage = 1;
        renderInvoiceList();
        return;
    }

    if (target.classList.contains("page-btn")) {
        event.preventDefault();
        const pageNumber = parseInt(target.dataset.page || "", 10);
        const nav = (target.dataset.pageNav || "").toLowerCase();
        const pageSize = invoiceState.pagination.pageSize;
        const totalPages = Math.max(1, Math.ceil(invoiceState.pagination.filteredRows.length / pageSize));

        if (Number.isFinite(pageNumber)) {
            invoiceState.pagination.currentPage = pageNumber;
        } else if (nav === "prev") {
            invoiceState.pagination.currentPage = Math.max(1, invoiceState.pagination.currentPage - 1);
        } else if (nav === "next") {
            invoiceState.pagination.currentPage = Math.min(totalPages, invoiceState.pagination.currentPage + 1);
        }

        renderInvoiceListPage();
        return;
    }

    const action = getAction(target);
    if (!action) {
        return;
    }

    if (action === "view") {
        openInvoiceDetailFromList(target);
    } else if (action === "edit") {
        openInvoiceEditFromList(target);
    } else if (action === "delete") {
        deleteInvoice(target);
    }
}

function handleDetailClick(event) {
    const target = event.target.closest("button, a");
    if (!target) {
        return;
    }

    const action = getAction(target);
    if (!action) {
        return;
    }

    if (action === "back") {
        showInvoiceList();
    } else if (action === "edit") {
        showInvoiceForm("edit");
    } else if (action === "delete") {
        deleteInvoice(target);
    } else if (action === "print") {
        window.print();
    }
}

function handleFormClick(event) {
    const target = event.target.closest("button, a");
    if (!target) {
        return;
    }

    const action = getAction(target);
    if (!action) {
        return;
    }

    if (action === "add-row") {
        addInvoiceRow();
    } else if (action === "remove-row") {
        removeInvoiceRow(target);
    } else if (action === "back") {
        showInvoiceList();
    } else if (action === "save") {
        saveInvoice();
    }
}

function handleFormInput(event) {
    const formSection = invoiceState.sections.form;
    if (!formSection) {
        return;
    }

    const input = event.target;
    if (!input) {
        return;
    }

    if (input.matches(".item-qty, [name=qty], .item-price, [name=unitPrice]")) {
        updateRowAmount(input.closest("tr"));
        recalculateInvoice();
    }
}

function getAction(element) {
    if (!element) {
        return null;
    }

    const action = (element.dataset.action || "").trim().toLowerCase();
    if (action) {
        return action;
    }

    const classList = element.classList;
    if (classList.contains("view") || classList.contains("view-invoice")) {
        return "view";
    }
    if (classList.contains("edit") || classList.contains("edit-invoice")) {
        return "edit";
    }
    if (classList.contains("back") || classList.contains("back-to-list")) {
        return "back";
    }
    if (classList.contains("save") || classList.contains("save-invoice")) {
        return "save";
    }
    if (classList.contains("delete") || classList.contains("delete-invoice")) {
        return "delete";
    }
    if (classList.contains("print") || classList.contains("print-invoice")) {
        return "print";
    }
    if (classList.contains("add-row") || classList.contains("add-item")) {
        return "add-row";
    }
    if (classList.contains("remove-row") || classList.contains("remove-item")) {
        return "remove-row";
    }

    const label = element.textContent.trim().toLowerCase();
    if (label === "view") {
        return "view";
    }
    if (label === "edit") {
        return "edit";
    }
    if (label === "back") {
        return "back";
    }
    if (label === "save") {
        return "save";
    }
    if (label === "delete") {
        return "delete";
    }
    if (label === "print") {
        return "print";
    }
    if (label === "add row" || label === "+ add row" || label === "add item") {
        return "add-row";
    }
    if (label === "remove" || label === "remove row" || label === "delete row") {
        return "remove-row";
    }

    return null;
}

function openInvoiceDetailFromList(target) {
    const row = target.closest("tr");
    if (row) {
        invoiceState.currentInvoice = extractInvoiceFromRow(row);
    }
    showInvoiceDetail();
}

function openInvoiceEditFromList(target) {
    const row = target.closest("tr");
    if (row) {
        invoiceState.currentInvoice = extractInvoiceFromRow(row);
    }
    showInvoiceForm("edit");
}

function extractInvoiceFromRow(row) {
    const cells = Array.from(row.querySelectorAll("td"));
    const invoiceNo = cells[0] ? cells[0].textContent.trim() : "";
    const customer = cells[1] ? cells[1].textContent.trim() : "";
    const invoiceDate = cells[2] ? cells[2].textContent.trim() : "";
    const dueDate = cells[3] ? cells[3].textContent.trim() : "";
    const totalText = cells[cells.length - 2] ? cells[cells.length - 2].textContent.trim() : "";
    const total = parseNumber(totalText);

    return {
        invoiceNo,
        customer,
        invoiceDate,
        dueDate,
        notes: "",
        gstRate: 0.1,
        items: [{ description: "", qty: 1, unitPrice: total || 0, amount: total || 0 }]
    };
}

function saveInvoice() {
    const formSection = invoiceState.sections.form;
    if (!formSection) {
        return;
    }

    invoiceState.currentInvoice.invoiceNo = getInputValue(formSection, ["#invoiceNumber", ".invoice-number", "[name=invoiceNo]"]);
    invoiceState.currentInvoice.customer = getInputValue(formSection, ["#customerName", ".customer-name", "[name=customer]"]);
    invoiceState.currentInvoice.invoiceDate = getInputValue(formSection, ["#invoiceDate", ".invoice-date", "[name=invoiceDate]"]);
    invoiceState.currentInvoice.dueDate = getInputValue(formSection, ["#dueDate", ".due-date", "[name=dueDate]"]);
    invoiceState.currentInvoice.notes = getInputValue(formSection, ["#notes", ".invoice-notes", "[name=notes]"]);

    invoiceState.currentInvoice.gstRate = parseNumber(getInputValue(formSection, ["#gstRate", ".gst-rate", "[name=gstRate]"])) / 100 || 0.1;
    invoiceState.currentInvoice.items = Array.from(getItemsBody(formSection).querySelectorAll("tr")).map(row => {
        const descriptionInput = row.querySelector(".item-description") || row.querySelector("[name=description]");
        const qtyInput = row.querySelector(".item-qty") || row.querySelector("[name=qty]");
        const priceInput = row.querySelector(".item-price") || row.querySelector("[name=unitPrice]");
        const amountCell = row.querySelector(".item-amount");
        const qty = parseNumber(qtyInput ? qtyInput.value : 0);
        const unitPrice = parseNumber(priceInput ? priceInput.value : 0);
        const amount = qty * unitPrice;

        if (amountCell) {
            amountCell.textContent = formatMoney(amount);
        }

        return {
            description: descriptionInput ? descriptionInput.value.trim() : "",
            qty,
            unitPrice,
            amount
        };
    });

    recalculateInvoice();
    showInvoiceDetail();
}

function deleteInvoice(target) {
    const row = target.closest("tr");
    if (row && row.parentElement) {
        row.parentElement.removeChild(row);
        invoiceState.pagination.rows = invoiceState.pagination.rows.filter((item) => item !== row);
        renderInvoiceList();
    }
    if (invoiceState.sections.detail && invoiceState.sections.detail.contains(target)) {
        showInvoiceList();
    }
}

function addInvoiceRow() {
    const formSection = invoiceState.sections.form;
    const body = getItemsBody(formSection);

    if (!body) {
        return;
    }

    const row = document.createElement("tr");
    row.className = "invoice-item-row";
    row.innerHTML = `
        <td><input type="text" class="item-description" name="description" placeholder="Description"></td>
        <td><input type="number" class="item-qty" name="qty" min="0" step="1" value="1"></td>
        <td><input type="number" class="item-price" name="unitPrice" min="0" step="0.01" value="0.00"></td>
        <td class="item-amount">$0.00</td>
        <td><button type="button" class="remove-row">Remove</button></td>
    `;
    body.appendChild(row);
    recalculateInvoice();
}

function removeInvoiceRow(target) {
    const row = target.closest("tr");
    if (!row || !row.parentElement) {
        return;
    }

    row.parentElement.removeChild(row);
    recalculateInvoice();
}

function updateRowAmount(row) {
    if (!row) {
        return;
    }

    const qtyInput = row.querySelector(".item-qty") || row.querySelector("[name=qty]");
    const priceInput = row.querySelector(".item-price") || row.querySelector("[name=unitPrice]");
    const amountCell = row.querySelector(".item-amount");
    const qty = parseNumber(qtyInput ? qtyInput.value : 0);
    const unitPrice = parseNumber(priceInput ? priceInput.value : 0);
    const amount = qty * unitPrice;

    if (amountCell) {
        amountCell.textContent = formatMoney(amount);
    }
}

function recalculateInvoice() {
    const formSection = invoiceState.sections.form;
    const detailSection = invoiceState.sections.detail;
    const section = formSection || detailSection;
    if (!section) {
        return;
    }

    const body = getItemsBody(section);
    if (!body) {
        return;
    }

    const rows = Array.from(body.querySelectorAll("tr"));
    const subtotal = rows.reduce((sum, row) => {
        const amountCell = row.querySelector(".item-amount");
        const amount = parseNumber(amountCell ? amountCell.textContent.replace(/[^0-9.-]+/g, "") : 0);
        return sum + amount;
    }, 0);

    const gstRateInput = section.querySelector("#gstRate") || section.querySelector(".gst-rate") || section.querySelector("[name=gstRate]");
    const gstRate = gstRateInput ? parseNumber(gstRateInput.value) / 100 : invoiceState.currentInvoice.gstRate;
    const gst = subtotal * (isNaN(gstRate) ? invoiceState.currentInvoice.gstRate : gstRate);
    const total = subtotal + gst;

    updateSummaryElement(section, ["#subtotal", ".invoice-subtotal", "[data-field=subtotal]"], subtotal);
    updateSummaryElement(section, ["#gst", ".invoice-gst", "[data-field=gst]"], gst);
    updateSummaryElement(section, ["#total", ".invoice-total", "[data-field=total]"], total);

    if (section === formSection) {
        invoiceState.currentInvoice.items = rows.map(row => {
            const desc = row.querySelector(".item-description")?.value.trim() || "";
            const qty = parseNumber(row.querySelector(".item-qty")?.value);
            const price = parseNumber(row.querySelector(".item-price")?.value);
            const amount = qty * price;
            return { description: desc, qty, unitPrice: price, amount };
        });
        invoiceState.currentInvoice.gstRate = isNaN(gstRate) ? invoiceState.currentInvoice.gstRate : gstRate;
    }
}

function updateSummaryFields(section, invoice) {
    if (!section || !invoice) {
        return;
    }

    const subtotal = invoice.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const gst = subtotal * invoice.gstRate;
    const total = subtotal + gst;

    updateSummaryElement(section, ["#subtotal", ".invoice-subtotal", "[data-field=subtotal]"], subtotal);
    updateSummaryElement(section, ["#gst", ".invoice-gst", "[data-field=gst]"], gst);
    updateSummaryElement(section, ["#total", ".invoice-total", "[data-field=total]"], total);
}

function updateSummaryElement(section, selectors, value) {
    const element = getElement(selectors, section);
    if (!element) {
        return;
    }
    element.textContent = formatMoney(value);
}

function setTextContent(section, selectors, value) {
    const element = getElement(selectors, section);
    if (element) {
        element.textContent = value || "";
    }
}

function setInputValue(section, selectors, value) {
    const element = getElement(selectors, section);
    if (element) {
        element.value = value != null ? value : "";
    }
}

function getInputValue(section, selectors) {
    const element = getElement(selectors, section);
    if (element) {
        return element.value.trim();
    }
    return "";
}

function parseNumber(value) {
    if (typeof value === "number") {
        return value;
    }
    const result = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(result) ? result : 0;
}

function formatMoney(value) {
    const number = parseNumber(value);
    return number === 0 ? "$0.00" : `$${number.toFixed(2)}`;
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInvoicePage);
} else {
    initInvoicePage();
}
