  
  $(document).ready(function() {
    // --------------------------
    // 1. INITIALIZATION FUNCTIONS
    // --------------------------
    
    /**
     * Initialize Select2 for product dropdown with AJAX search
     * @param {HTMLElement} element - The select element
     * @param {Object|null} selectedProduct - Pre-selected product data
     */
    function initializeProductSelect2(element, selectedProduct = null) {
      const select2 = $(element).select2({
        theme: 'bootstrap4',
        placeholder: "Search product...",
        allowClear: true,
        ajax: {
          url: "/getproductsnames",
          dataType: "json",
          delay: 250,
          data: function(params) {
            return { q: params.term || "" };
          },
          processResults: function(data) {
            return {
              results: data.map(function(item) {
                return {
                  id: item._id || item.id,
                  text: item.name || item.text,
                  price: item.price || 0
                };
              }),
            };
          },
          cache: true
        }
      });
  
      // Set initial selection if provided
      if (selectedProduct) {
        const option = new Option(selectedProduct.name, selectedProduct._id, true, true);
        $(element).append(option).trigger('change');
        
        if (selectedProduct.price) {
          $(element).closest('tr').find('.price-input').val(selectedProduct.price).trigger('change');
        }
      }
  
      // Update price when product is selected
      select2.on('select2:select', function(e) {
        const data = e.params.data;
        const row = $(this).closest('tr');
        if (data.price) {
          row.find('.price-input').val(data.price).trigger('change');
        }
      });
  
      return select2;
    }
  
    /**
     * Add empty product row to the table
     */
    function addEmptyProductRow() {
      const productCount = $('#productsTable tbody tr').length;
      const newRow = `
        <tr>
          <td data-label="Product Name">
            <select class="form-control product-select" name="products[${productCount}][name]" required>
              <option value=""></option>
            </select>
          </td>
          <td data-label="Quantity">
            <input type="number" class="form-control quantity-input" name="products[${productCount}][quantity]" value="1" min="1" required>
          </td>
          <td data-label="Lend/Return">
            <select class="form-control" name="products[${productCount}][lrndtype]">
              <option value="Lend" selected>Lend</option>
              <option value="Return">Return</option>
            </select>
          </td>
          <td data-label="Unit Price">
            <input type="number" class="form-control price-input" name="products[${productCount}][price]" value="0.00" min="0" step="0.01" required>
          </td>
          <td data-label="Total" class="total-cell">0.00</td>
          <td data-label="Action">
            <button type="button" class="btn-remove remove-product">
              <i class="fas fa-times"></i>
            </button>
          </td>
        </tr>
      `;
      $('#productsTable tbody').append(newRow);
      initializeProductSelect2($('#productsTable tbody tr:last .product-select'));
    }
  
    /**
     * Update the order summary calculations
     */
    function updateOrderSummary() {
      let subtotal = 0;
      
      // Calculate products subtotal
      $('#productsTable tbody tr').each(function() {
        const quantity = parseFloat($(this).find('.quantity-input').val()) || 0;
        const price = parseFloat($(this).find('.price-input').val()) || 0;
        subtotal += quantity * price;
      });
      
      // Calculate payments total
      let paymentsTotal = 0;
      $('.payment-amount').each(function() {
        paymentsTotal += parseFloat($(this).val()) || 0;
      });
      
      const balance = subtotal - paymentsTotal;
      
      // Update display
      $('#subtotalAmount').text(subtotal.toFixed(2));
      $('#creditPaidAmount').text(paymentsTotal.toFixed(2));
      $('#totalAmount').text(balance.toFixed(2));
    }
  
    /**
     * Populate form with order data from server
     */
    function populateFormWithOrderData() {
      if (!serverOrderData) return;
      
      // Basic order info
      $('#customerName').val(serverOrderData.name).trigger('change');
      $('#customerCode').val(serverOrderData.customerId).trigger('change');
      $('#truckId').val(serverOrderData.truckId).trigger('change');
      $('#zone').val(serverOrderData.area).trigger('change');
      $('#status').val(serverOrderData.status || 'PENDING');
      
      // Products table
      const productsTable = $('#productsTable tbody');
      productsTable.empty();
      
      if (serverOrderData.order && serverOrderData.order.length > 0) {
        serverOrderData.order.forEach((product, index) => {
          const productRow = `
            <tr>
              <td data-label="Product Name">
                <select class="form-control product-select" name="products[${index}][name]" required>
                  ${product.productname ? `<option value="${product._id || product.id}" selected>${product.productname}</option>` : ''}
                </select>
              </td>
              <td data-label="Quantity">
                <input type="number" class="form-control quantity-input" name="products[${index}][quantity]" 
                       value="${product.quantity || 1}" min="1" required>
              </td>
              <td data-label="Lend/Return">
                <select class="form-control" name="products[${index}][lrndtype]">
                  <option value="Lend" ${product.lendtype === 'Lend' ? 'selected' : ''}>Lend</option>
                  <option value="Return" ${product.lendtype === 'Return' ? 'selected' : ''}>Return</option>
                </select>
              </td>
              <td data-label="Unit Price">
                <input type="number" class="form-control price-input" name="products[${index}][price]" 
                       value="${product.price || 0}" min="0" step="0.01" required>
              </td>
              <td data-label="Total" class="total-cell">
                ${(product.quantity * product.price || 0).toFixed(2)}
              </td>
              <td data-label="Action">
                <button type="button" class="btn-remove remove-product">
                  <i class="fas fa-times"></i>
                </button>
              </td>
            </tr>
          `;
          productsTable.append(productRow);
          
          // Initialize Select2 with the current product
          initializeProductSelect2(
            productsTable.find('tr:last .product-select'), 
            {
              _id: product._id || product.id,
              name: product.productname,
              price: product.price
            }
          );
        });
      } else {
        addEmptyProductRow();
      }
      
      updateOrderSummary();
    }
  
    // --------------------------
    // 2. INITIAL SETUP
    // --------------------------
    
    // Initialize Select2 dropdowns
    $('.customer-name-js').select2({
      theme: 'bootstrap4',
      placeholder: "Search customer name...",
      allowClear: true,
      dropdownParent: $("#cardb"),
      ajax: {
        url: "/customersee",
        dataType: "json",
        delay: 250,
        data: function(params) {
          return {
            search: params.term || "",
            customerId: $("#customerCode").val() || ""
          };
        },
        processResults: function(data) {
          return {
            results: data.map(function(item) {
              return { id: item.name, text: item.name };
            }),
          };
        },
      },
      data: serverOrderData.name ? [{ id: serverOrderData.name, text: serverOrderData.name }] : []
    }).val(serverOrderData.name || null).trigger('change');
  
    $('.customer-code-js').select2({
      theme: 'bootstrap4',
      placeholder: "Search customer code...",
      allowClear: true,
      ajax: {
        url: "/customersee",
        dataType: "json",
        delay: 250,
        data: function(params) {
          return {
            search: params.term || "",
            customerName: $("#customerName").val() || ""
          };
        },
        processResults: function(data) {
          return {
            results: data.map(function(item) {
              return { id: item.id, text: item.id };
            }),
          };
        },
      },
      data: serverOrderData.customerId ? [{ id: serverOrderData.customerId, text: serverOrderData.customerId }] : []
    }).val(serverOrderData.customerId || null).trigger('change');
  
    $('.truck-js').select2({
      theme: 'bootstrap4',
      placeholder: "Search truck...",
      allowClear: true,
      ajax: {
        url: '/truckids',
        dataType: 'json',
        delay: 250,
        data: function(params) {
          return {
            search: params.term,
            customKey: 'utilities'
          };
        },
        processResults: function(data) {
          return {
            results: data.map(function(item) {
              return { id: item.id, text: item.id };
            }),
          };
        },
      },
      data: serverOrderData.truckId ? [{ id: serverOrderData.truckId, text: serverOrderData.truckId }] : []
    }).val(serverOrderData.truckId || null).trigger('change');
  
    $('.zone-js').select2({
      theme: 'bootstrap4',
      placeholder: "Search zone...",
      allowClear: true,
      ajax: {
        url: '/zoneids',
        dataType: 'json',
        delay: 250,
        data: function(params) {
          return {
            q: params.term,
            truckid: $('#truckId').val()
          };
        },
        processResults: function(data) {
          return {
            results: data.map(function(item) {
              return { id: item.id, text: item.id };
            }),
          };
        },
      },
      data: serverOrderData.area ? [{ id: serverOrderData.area, text: serverOrderData.area }] : []
    }).val(serverOrderData.area || null).trigger('change');
  
    // Populate form with order data
    populateFormWithOrderData();
  
    // --------------------------
    // 3. EVENT HANDLERS
    // --------------------------
    
    // Product quantity/price changes
    $(document).on('change', '.quantity-input, .price-input', function() {
      const row = $(this).closest('tr');
      const quantity = parseFloat(row.find('.quantity-input').val()) || 0;
      const price = parseFloat(row.find('.price-input').val()) || 0;
      const total = (quantity * price).toFixed(2);
      row.find('.total-cell').text(total);
      updateOrderSummary();
    });
  
    // Add product button
    $('#addProductBtn').click(addEmptyProductRow);
  
    // Remove product button
    $(document).on('click', '.remove-product', function() {
      if($('#productsTable tbody tr').length > 0) {
        $(this).closest('tr').remove();
        updateOrderSummary();
      }
    });
  
    // Add payment button
    $('#addPaymentBtn').click(function() {
      const paymentCount = $('#paymentsTable tbody tr').length;
      const today = new Date().toLocaleDateString();
      
      const newRow = `
        <tr>
          <td data-label="Payment Date">
            <input type="text" class="form-control" name="payments[${paymentCount}][date]" value="${today}" readonly>
          </td>
          <td data-label="Amount">
            <input type="number" class="form-control payment-amount" name="payments[${paymentCount}][amount]" value="0.00" min="0" step="0.01" required>
          </td>
          <td data-label="Salesman ID">
            <input type="text" class="form-control" disabled value="Admin" name="payments[${paymentCount}][salesman]" placeholder="Salesman ID" required>
          </td>
          <td data-label="Payment Mode">
            <select class="form-control" name="payments[${paymentCount}][mode]" required>
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Check">Check</option>
            </select>
          </td>
          <td data-label="Action">
            <button type="button" class="btn-remove remove-payment">
              <i class="fas fa-times"></i>
            </button>
          </td>
        </tr>
      `;
      $('#paymentsTable tbody').append(newRow);
    });
  
    // Remove payment button
    $(document).on('click', '.remove-payment', function() {
      $(this).closest('tr').remove();
      updateOrderSummary();
    });
  
    // Payment amount changes
    $(document).on('change', '.payment-amount', updateOrderSummary);
  
    // Delete order button
    $('#deleteOrderBtn').click(function() {
      const orderId = $(this).data('id');
      
      if(confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
        $.ajax({
          url: `/delete-order/`,
          method: 'POST',
          data: {id: orderId},
          success: function(response) {
            if(response.success) {
              window.location.href = '/orders?success=Order deleted successfully';
            } else {
              alert('Error deleting order: ' + (response.message || 'Unknown error'));
            }
          },
          error: function(xhr) {
            alert('Error deleting order. Please try again.');
          }
        });
      }
    });
  
    // Form submission
    $('#orderForm').submit(function(e) {
      e.preventDefault();
      
      const formData = $(this).serialize();
      const orderId = $(this).find('input[name="orderId"]').val();
      
      $.ajax({
        url: `/orders/update/${orderId}`,
        method: 'POST',
        data: formData,
        success: function(response) {
          if(response.success) {
            window.location.href = `/orders/${orderId}?success=Order updated successfully`;
          } else {
            alert('Error updating order: ' + (response.message || 'Unknown error'));
          }
        },
        error: function(xhr) {
          alert('Error updating order. Please try again.');
        }
      });
    });
  });
 