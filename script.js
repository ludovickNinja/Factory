const poTableBody = document.getElementById('po-table-body');
const poSearchInput = document.getElementById('po-search');
const statusFilter = document.getElementById('status-filter');
const selectAllCheckbox = document.getElementById('select-all');
const selectionCount = document.getElementById('selection-count');
const bulkReceivedButton = document.getElementById('bulk-received');
const bulkDownloadButton = document.getElementById('bulk-download');

const purchaseOrders = [
  {
    poNumber: '660371',
    dateOrdered: '03/11/2026',
    skuLines: [
      { sku: 'GEM-RG-001', quantity: 120 },
      { sku: 'GEM-PD-014', quantity: 80 },
    ],
    orderProfile: 'Re-Order',
    status: 'Sent',
    dateNeeded: '03/24/2026',
    rush: true,
  },
  {
    poNumber: '660380',
    dateOrdered: '03/11/2026',
    skuLines: [
      { sku: 'GEM-RG-009', quantity: 140 },
      { sku: 'GEM-ER-002', quantity: 60 },
      { sku: 'GEM-BR-031', quantity: 30 },
    ],
    orderProfile: 'Re-Order',
    status: 'Received',
    dateNeeded: '03/20/2026',
    rush: true,
  },
  {
    poNumber: '660390',
    dateOrdered: '03/11/2026',
    skuLines: [
      { sku: 'GEM-NK-022', quantity: 90 },
      { sku: 'GEM-RG-020', quantity: 75 },
    ],
    orderProfile: 'Re-Order',
    status: 'In Production',
    dateNeeded: '03/24/2026',
    rush: true,
  },
  {
    poNumber: '660356',
    dateOrdered: '03/11/2026',
    skuLines: [
      { sku: 'GEM-ER-017', quantity: 50 },
      { sku: 'GEM-BR-011', quantity: 40 },
      { sku: 'GEM-RG-003', quantity: 35 },
    ],
    orderProfile: 'Re-Order',
    status: 'Need More Time',
    dateNeeded: '03/24/2026',
    rush: false,
  },
  {
    poNumber: '660333',
    dateOrdered: '03/11/2026',
    skuLines: [{ sku: 'GEM-NK-010', quantity: 100 }],
    orderProfile: 'New Design',
    status: 'Shipped',
    dateNeeded: '03/20/2026',
    rush: false,
  },
];

const selectedPoNumbers = new Set();

function statusClassName(status) {
  return `status-pill status-${status.toLowerCase().replace(/\s+/g, '-')}`;
}

function getFilteredOrders() {
  const searchValue = poSearchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  return purchaseOrders.filter((order) => {
    const matchesSearch = order.poNumber.toLowerCase().includes(searchValue);
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });
}

function updateBulkUi(filteredOrders) {
  const visiblePoNumbers = filteredOrders.map((order) => order.poNumber);
  const selectedVisibleCount = visiblePoNumbers.filter((poNumber) => selectedPoNumbers.has(poNumber)).length;

  selectionCount.textContent = `${selectedPoNumbers.size} selected`;

  const hasAnySelection = selectedPoNumbers.size > 0;
  bulkReceivedButton.disabled = !hasAnySelection;
  bulkDownloadButton.disabled = !hasAnySelection;

  if (visiblePoNumbers.length === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
    return;
  }

  selectAllCheckbox.checked = selectedVisibleCount === visiblePoNumbers.length;
  selectAllCheckbox.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visiblePoNumbers.length;
}

function renderPurchaseOrders() {
  const filteredOrders = getFilteredOrders();

  if (filteredOrders.length === 0) {
    poTableBody.innerHTML =
      '<tr><td class="empty-row" colspan="10">No purchase orders match your filters.</td></tr>';
    updateBulkUi(filteredOrders);
    return;
  }

  poTableBody.innerHTML = filteredOrders
    .map(
      (order) => `
        <tr>
          <td>
            <input
              class="row-select"
              type="checkbox"
              data-po-number="${order.poNumber}"
              aria-label="Select PO ${order.poNumber}"
              ${selectedPoNumbers.has(order.poNumber) ? 'checked' : ''}
            />
          </td>
          <td>${order.poNumber}</td>
          <td>${order.dateOrdered}</td>
          <td>${order.skuLines.map((line) => line.sku).join(', ')}</td>
          <td>${order.skuLines.reduce((sum, line) => sum + line.quantity, 0)}</td>
          <td>${order.orderProfile}</td>
          <td><span class="${statusClassName(order.status)}">${order.status}</span></td>
          <td>${order.dateNeeded}</td>
          <td>${order.rush ? '✓' : '—'}</td>
          <td>
            <div class="action-group">
              <button type="button" class="table-btn">Download Job Bag</button>
              <button type="button" class="table-btn">Confirm Received</button>
              <button type="button" class="table-btn">Mark Shipped</button>
              <button type="button" class="table-btn subtle">Need More Time</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');

  updateBulkUi(filteredOrders);
}

function bulkMarkReceived() {
  if (selectedPoNumbers.size === 0) {
    return;
  }

  purchaseOrders.forEach((order) => {
    if (selectedPoNumbers.has(order.poNumber)) {
      order.status = 'Received';
    }
  });

  renderPurchaseOrders();
}

function bulkDownloadJobBags() {
  if (selectedPoNumbers.size === 0) {
    return;
  }

  const poList = [...selectedPoNumbers].sort().join(', ');
  alert(`Bulk job bag download queued for PO(s): ${poList}`);
}

poSearchInput.addEventListener('input', renderPurchaseOrders);
statusFilter.addEventListener('change', renderPurchaseOrders);

selectAllCheckbox.addEventListener('change', () => {
  const filteredOrders = getFilteredOrders();

  filteredOrders.forEach((order) => {
    if (selectAllCheckbox.checked) {
      selectedPoNumbers.add(order.poNumber);
    } else {
      selectedPoNumbers.delete(order.poNumber);
    }
  });

  renderPurchaseOrders();
});

poTableBody.addEventListener('change', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || !target.classList.contains('row-select')) {
    return;
  }

  const poNumber = target.dataset.poNumber;
  if (!poNumber) {
    return;
  }

  if (target.checked) {
    selectedPoNumbers.add(poNumber);
  } else {
    selectedPoNumbers.delete(poNumber);
  }

  renderPurchaseOrders();
});

bulkReceivedButton.addEventListener('click', bulkMarkReceived);
bulkDownloadButton.addEventListener('click', bulkDownloadJobBags);

renderPurchaseOrders();
