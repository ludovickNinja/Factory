const poTableBody = document.getElementById('po-table-body');
const poSearchInput = document.getElementById('po-search');
const statusFilter = document.getElementById('status-filter');
const orderDateFilter = document.getElementById('order-date-filter');
const dateNeededFilter = document.getElementById('date-needed-filter');
const selectAllCheckbox = document.getElementById('select-all');
const selectionCount = document.getElementById('selection-count');
const bulkReceivedButton = document.getElementById('bulk-received');
const bulkDownloadButton = document.getElementById('bulk-download');
const bulkDownloadErpButton = document.getElementById('bulk-download-erp');
const bulkConfirmShippedButton = document.getElementById('bulk-confirm-shipped');
const sortButtons = document.querySelectorAll('.sort-btn');

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
const currentSort = {
  key: null,
  direction: 'asc',
};

function statusClassName(status) {
  return `status-pill status-${status.toLowerCase().replace(/\s+/g, '-')}`;
}

function formatDateForComparison(mmDdYyyyDate) {
  const [month, day, year] = mmDdYyyyDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function getSortValue(order, key) {
  if (key === 'poNumber') {
    return Number(order.poNumber);
  }

  if (key === 'dateOrdered') {
    return formatDateForComparison(order.dateOrdered);
  }

  if (key === 'sku') {
    return order.skuLines.map((line) => line.sku).join(', ');
  }

  if (key === 'totalPcs') {
    return order.skuLines.reduce((sum, line) => sum + line.quantity, 0);
  }

  if (key === 'orderProfile') {
    return order.orderProfile;
  }

  if (key === 'status') {
    return order.status;
  }

  if (key === 'dateNeeded') {
    return formatDateForComparison(order.dateNeeded);
  }

  if (key === 'rush') {
    return order.rush ? 1 : 0;
  }

  return '';
}

function sortOrders(orders) {
  if (!currentSort.key) {
    return orders;
  }

  return [...orders].sort((a, b) => {
    const aValue = getSortValue(a, currentSort.key);
    const bValue = getSortValue(b, currentSort.key);

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return currentSort.direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    const result = String(aValue).localeCompare(String(bValue));
    return currentSort.direction === 'asc' ? result : -result;
  });
}

function getVisibleOrders() {
  const searchValue = poSearchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedOrderDate = orderDateFilter.value;
  const selectedDateNeeded = dateNeededFilter.value;

  const filteredOrders = purchaseOrders.filter((order) => {
    const matchesSearch = order.poNumber.toLowerCase().includes(searchValue);
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesOrderDate = !selectedOrderDate || formatDateForComparison(order.dateOrdered) === selectedOrderDate;
    const matchesDateNeeded = !selectedDateNeeded || formatDateForComparison(order.dateNeeded) === selectedDateNeeded;

    return matchesSearch && matchesStatus && matchesOrderDate && matchesDateNeeded;
  });

  return sortOrders(filteredOrders);
}

function updateSortUi() {
  sortButtons.forEach((button) => {
    const key = button.dataset.sortKey;

    if (key !== currentSort.key) {
      button.textContent = button.textContent.replace(/\s[↑↓]$/, '');
      return;
    }

    const baseText = button.textContent.replace(/\s[↑↓]$/, '');
    const arrow = currentSort.direction === 'asc' ? '↑' : '↓';
    button.textContent = `${baseText} ${arrow}`;
  });
}

function updateBulkUi(visibleOrders) {
  const visiblePoNumbers = visibleOrders.map((order) => order.poNumber);
  const selectedVisibleCount = visiblePoNumbers.filter((poNumber) => selectedPoNumbers.has(poNumber)).length;

  selectionCount.textContent = `${selectedPoNumbers.size} selected`;

  const hasAnySelection = selectedPoNumbers.size > 0;
  bulkReceivedButton.disabled = !hasAnySelection;
  bulkDownloadButton.disabled = !hasAnySelection;
  bulkDownloadErpButton.disabled = !hasAnySelection;
  bulkConfirmShippedButton.disabled = !hasAnySelection;

  if (visiblePoNumbers.length === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
    return;
  }

  selectAllCheckbox.checked = selectedVisibleCount === visiblePoNumbers.length;
  selectAllCheckbox.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visiblePoNumbers.length;
}

function escapeCsvCell(value) {
  const escaped = String(value).replaceAll('"', '""');
  return `"${escaped}"`;
}

function downloadPoRequestExcel(order) {
  const headers = [
    'PO Number',
    'Date Ordered',
    'Date Needed',
    'Order Profile',
    'Status',
    'Rush',
    'SKU',
    'Quantity',
  ];

  const csvRows = [headers.join(',')];

  order.skuLines.forEach((line) => {
    csvRows.push(
      [
        order.poNumber,
        order.dateOrdered,
        order.dateNeeded,
        order.orderProfile,
        order.status,
        order.rush ? 'Yes' : 'No',
        line.sku,
        line.quantity,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  });

  const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(csvBlob);
  downloadLink.download = `PO-${order.poNumber}-erp-request.csv`;
  downloadLink.click();
  URL.revokeObjectURL(downloadLink.href);
}

function renderPurchaseOrders() {
  const visibleOrders = getVisibleOrders();

  if (visibleOrders.length === 0) {
    poTableBody.innerHTML =
      '<tr><td class="empty-row" colspan="10">No purchase orders match your filters.</td></tr>';
    updateBulkUi(visibleOrders);
    updateSortUi();
    return;
  }

  poTableBody.innerHTML = visibleOrders
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
              <button type="button" class="table-btn" data-action="download-job-bag" data-po-number="${order.poNumber}">Download Job Bag</button>
              <button type="button" class="table-btn" data-action="download-erp-excel" data-po-number="${order.poNumber}">Download ERP Excel</button>
              <button type="button" class="table-btn" data-action="confirm-received" data-po-number="${order.poNumber}">Confirm Received</button>
              <button type="button" class="table-btn" data-action="mark-shipped" data-po-number="${order.poNumber}">Mark Shipped</button>
              <button type="button" class="table-btn subtle" data-action="need-more-time" data-po-number="${order.poNumber}">Need More Time</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');

  updateBulkUi(visibleOrders);
  updateSortUi();
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

function bulkDownloadErpExcels() {
  if (selectedPoNumbers.size === 0) {
    return;
  }

  purchaseOrders
    .filter((order) => selectedPoNumbers.has(order.poNumber))
    .forEach((order) => {
      downloadPoRequestExcel(order);
    });
}

function bulkConfirmShipped() {
  if (selectedPoNumbers.size === 0) {
    return;
  }

  purchaseOrders.forEach((order) => {
    if (selectedPoNumbers.has(order.poNumber)) {
      order.status = 'Shipped';
    }
  });

  renderPurchaseOrders();
}

function handlePoAction(action, poNumber) {
  const order = purchaseOrders.find((item) => item.poNumber === poNumber);
  if (!order) {
    return;
  }

  if (action === 'download-job-bag') {
    alert(`Job bag download queued for PO ${poNumber}`);
    return;
  }

  if (action === 'download-erp-excel') {
    downloadPoRequestExcel(order);
    return;
  }

  if (action === 'confirm-received') {
    order.status = 'Received';
    renderPurchaseOrders();
    return;
  }

  if (action === 'mark-shipped') {
    order.status = 'Shipped';
    renderPurchaseOrders();
    return;
  }

  if (action === 'need-more-time') {
    order.status = 'Need More Time';
    renderPurchaseOrders();
  }
}

poSearchInput.addEventListener('input', renderPurchaseOrders);
statusFilter.addEventListener('change', renderPurchaseOrders);
orderDateFilter.addEventListener('change', renderPurchaseOrders);
dateNeededFilter.addEventListener('change', renderPurchaseOrders);

sortButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.dataset.sortKey;

    if (!key) {
      return;
    }

    if (currentSort.key === key) {
      currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      currentSort.key = key;
      currentSort.direction = 'asc';
    }

    renderPurchaseOrders();
  });
});

selectAllCheckbox.addEventListener('change', () => {
  const visibleOrders = getVisibleOrders();

  visibleOrders.forEach((order) => {
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

poTableBody.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.classList.contains('table-btn')) {
    return;
  }

  const action = target.dataset.action;
  const poNumber = target.dataset.poNumber;

  if (!action || !poNumber) {
    return;
  }

  handlePoAction(action, poNumber);
});

bulkReceivedButton.addEventListener('click', bulkMarkReceived);
bulkDownloadButton.addEventListener('click', bulkDownloadJobBags);
bulkDownloadErpButton.addEventListener('click', bulkDownloadErpExcels);
bulkConfirmShippedButton.addEventListener('click', bulkConfirmShipped);

renderPurchaseOrders();
