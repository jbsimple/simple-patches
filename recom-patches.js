console.log('ReCom Patches Loaded');
document.head.innerHTML += '<link rel="stylesheet" href="https://raw.githubusercontent.com/jbsimple/simple-patches/main/recom-patches.css" type="text/css"/>';

if (window.location.href.includes('/receiving/queues/listing/')) {

    // verify gtin code for listing
    var gtin_input = document.querySelectorAll('.product_gtin')[0]; //inital
    gtin_input = document.querySelector('input[name="product[gtin]"]'); //if specific loaded
    
    var generateButton = document.querySelector('a[href="javascript:generateGtin();"]');
    
    if (gtin_input) {
            if (gtin_input.value || gtin_input.getAttribute('value')) {
                    verifyGTIN();
            }
            
            gtin_input.addEventListener('input', function() {
            verifyGTIN();
        });
        
        if (generateButton) {
                generateButton.addEventListener('click', function() {
                        setTimeout(function() {
                                verifyGTIN();
                        }, 500); // yikes
                });
        }
        
        function verifyGTIN() {
            var valueLength = gtin_input.value.length;
            console.log(valueLength);
            
            if (valueLength > 12) {
                gtin_input.style.outline = "2px solid var(--bs-danger)";
                gtin_input.style.backgroundColor = "color-mix(in srgb, var(--bs-danger) 15%, rgb(255,255,255,0))";
                addInvalidFeedback();
            } else {
                gtin_input.style.outline = "";
                gtin_input.style.backgroundColor = "";
                removeInvalidFeedback();
            }
        }
        
        function addInvalidFeedback() {
            if (!document.getElementById('gtin-feedback')) {
                var feedbackDiv = document.createElement('div');
                feedbackDiv.id = 'gtin-feedback';
                feedbackDiv.className = 'fv-plugins-message-container invalid-feedback';
                feedbackDiv.textContent = 'The GTIN is invalid';
    
                gtin_input.parentNode.appendChild(feedbackDiv);
            }
        }
        
        function removeInvalidFeedback() {
            var feedbackDiv = document.getElementById('gtin-feedback');
            if (feedbackDiv) {
                feedbackDiv.parentNode.removeChild(feedbackDiv);
            }
        }
    } // end gtin verify for listing


}

if (window.location.href.includes('/queues/conditions/')) {
    var parentInject = document.getElementById('bulk_assign').parentNode;

    var exportButton = document.createElement('a');
    exportButton.classList.add('btn');
    exportButton.classList.add('btn-info');
    exportButton.classList.add('btn-sm');
    exportButton.style.marginLeft = "0.5rem";
    exportButton.innerHTML = "Export Table";
    exportButton.onclick = exportTable;
    parentInject.appendChild(exportButton);

    function exportTable() {
        const table = document.getElementById('dtTable');
        const thead = table.getElementsByTagName('thead')[0];
        const tbody = table.getElementsByTagName('tbody')[0];
        
        var filename = "" + Date.now() + "_" + document.title.split(' - ')[0];
        filename = filename.replace(/ /g, '-');
        let csvContent = "";
        
        // Extract headers
    let headers = [];
    for (const headerCell of thead.rows[0].cells) {
        headers.push(`"${headerCell.textContent.trim()}"`);
    }
    
    headers[0] = '"SKU"';
    headers[1] = '"Product Title"';
    headers[7] = '"Date Entered"';
    headers[8] = '"Date Updated"';

    // Add headers to CSV content
    csvContent += headers.join(',') + '\r\n';
        
        for (const row of tbody.rows) {
            let rowData = [];
            for (let i = 0; i < row.cells.length; i++) {
                if (i !== 0 && i !== row.cells.length - 1) {
                    let cell = row.cells[i];
                    if (i === row.cells.length - 2) {
                        let tempDiv = document.createElement('div');
                        tempDiv.innerHTML = cell.innerHTML;
                        let parts = tempDiv.innerHTML.split('<br>');
                        if (parts.length > 1) {
                            let firstPart = document.createElement('div');
                            firstPart.innerHTML = parts[0];
                            let secondPart = document.createElement('div');
                            secondPart.innerHTML = parts[1];
                            rowData.push(`"${firstPart.textContent.trim()}"`, `"${secondPart.textContent.trim()}"`);
                        } else {
                            rowData.push(`"${tempDiv.textContent.trim()}"`, "");
                        }
                    } else if (cell.querySelector('span.fw-bolder') && cell.querySelector('a.text-muted')) {
                        let spanContent = cell.querySelector('span.fw-bolder').textContent.trim();
                        let aContent = cell.querySelector('a.text-muted').textContent.trim();
                        rowData.push(`"${spanContent}"`, `"${aContent}"`);
                    } else {
                        let tempDiv = document.createElement('div');
                        tempDiv.innerHTML = cell.innerHTML;
                        let cleanedData = (tempDiv.textContent || tempDiv.innerText || '').replace(/(\r\n|\n|\r)/gm, "").trim();
                        cleanedData = cleanedData.replace(/,/g, '');
                        cleanedData = /[,\r\n]/.test(cleanedData) ? `"${cleanedData}"` : cleanedData;
                        rowData.push(cleanedData);
                    }
                }
            }
            csvContent += rowData.join(',') + '\r\n';
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.setAttribute("download", filename);
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();

        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
        
    }

    var tallyButton = document.createElement('a');
    tallyButton.classList.add('btn');
    tallyButton.classList.add('btn-info');
    tallyButton.classList.add('btn-sm');
    tallyButton.style.marginLeft = "0.5rem";
    tallyButton.innerHTML = "Get Total";
    tallyButton.onclick = tallyTable;
    parentInject.appendChild(tallyButton);

    function tallyTable() {
        var total = 0;
        var trElements = document.getElementsByTagName('tr');
        for (let i = 0; i < trElements.length; i++) {
            var trObj = trElements[i];
            if (trObj.classList.contains('odd') || trObj.classList.contains('even')) {
                var tdElements = trObj.getElementsByTagName('td');
                if (tdElements.length >= 4) {
                    var fourthTd = tdElements[3];
                    var strongElement = fourthTd.querySelector('strong');
                    if (strongElement !== null) {
                        var numberString = strongElement.textContent.trim();
                        var number = parseInt(numberString, 10);
                        total += number;
                    }
                }
            }
        }
        
        if (document.getElementById('showTotal')) {
            document.getElementById('showTotal').remove();
        }
        
        var showTotal = document.createElement('span');
        showTotal.id = "showTotal";
        showTotal.style.height = "38px";
        showTotal.style.borderTopRightRadius = "20px";
        showTotal.style.borderBottomRightRadius = "20px";
        showTotal.style.backgroundColor = "rgb(0,0,0,0.1)";
        showTotal.style.display = "flex";
        showTotal.style.justifyContent = "center";
        showTotal.style.alignItems = "center";
        showTotal.style.textAlign = "center";
        showTotal.style.paddingLeft = "20px";
        showTotal.style.paddingRight = "20px";
        showTotal.style.border = "1px solid black";
        showTotal.innerHTML = "<strong>" + total + "</strong>"
        parentInject.appendChild(showTotal);
    }
}

if (window.location.href.includes('/products') || window.location.href.includes('/product/item')) {
    document.head.innerHTML += '<link rel="stylesheet" href="https://raw.githubusercontent.com/jbsimple/simple-patches/main/recom-patches-product.css" type="text/css"/>';

    /*
    var media_tab = document.getElementById('rc_product_media_tab');
    var media_tree = document.getElementById('product-images-container');
    var media_tree_parent = media_tree.parentNode;

    if (media_tab && media_tree) {
        var newElement = document.createElement('div');
        newElement.classList.add('fv-row');
        newElement.classList.add('mb-2');
        newElement.style.paddingBottom = "1rem";

        var button = document.createElement('button');
        button.classList.add('btn');
        button.classList.add('btn-danger');
        button.textContent = 'Remove Images';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '10px 20px';
        button.style.cursor = 'pointer';
        button.style.borderRadius = '5px';

        button.addEventListener('click', function() {
                var deleteImages = document.querySelectorAll('.delete-image');
                deleteImages.forEach(function(item) {
                        var id = item.getAttribute('data-id');
                        var type = item.getAttribute('data-type');
                        var remove = false;
                        fetch("ajax/actions/productimagedelete/" + id, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-CSRF-TOKEN": document.querySelector('meta[name="X-CSRF-TOKEN"]').getAttribute("content")
                            },
                            body: JSON.stringify({ id: id, type: type })
                            })
                            .then(response => response.json())
                            .then(data => {
                            apiResponseAlert(data);
                            remove = true;
                            })
                            .catch(error => {
                            console.log("FAIL", error);
                            });
                            if (remove) {
                                item.remove();
                            }
                    });
        });

        newElement.appendChild(button);
        media_tree_parent.insertBefore(newElement, media_tree);
    } */

}

if (window.location.href.includes('/receiving')) {
    //https://dev.recomapp.com/assets/app/js/inventory/new.js
    var RCnewInventory = (function () {
        var productSearchResultsDiv = "#inventory_results";
        const handleAddInventory = () => {
        const formID = "rc_new_inventory_modal_form";
        const submitButtonID = "#rc_new_inventory_modal_submit";
        const form = document.getElementById(formID);
        const submitButton = document.getElementById('rc_new_inventory_modal_submit');
        const gtinInput = document.querySelector('input[name="inventory[meta][gtin]"]');
    
        var validator = validateForm(form);
        $(submitButtonID).off('click'); // remove previous onlick
        
        // this onlclick is modified for gtin check
        $(submitButtonID).click(function (e) {
            
            e.preventDefault();
    
            if (validator) {
                
            validator.validate().then(function (status) {
                
                // if the gtin field is blank, don't allow submission
                if (status == "Valid" && gtinInput.value.trim() === '') {
                gtinInput.style.borderColor = 'red';
                gtinInput.style.backgroundColor = 'rgb(255,100,100,0.1)';
                
                // check to see if error message is already there
                if (!document.getElementById('jb_products_new_error_message')) {
                    const errorMessage = document.createElement('span');
                    errorMessage.id = 'jb_products_new_error_message'
                    errorMessage.style.marginTop = "8px";
                    errorMessage.textContent = 'The GTIN field cannot be empty.';
                    errorMessage.style.color = 'rgb(255,100,100)';
                    errorMessage.classList.add('error-message');
                    document.querySelector('.col-md-12.fv-row').appendChild(errorMessage);
                }
                
                // stop submission
                
                return false;
                } else {
                    // reset style
                    gtinInput.style.borderColor = '';
                    gtinInput.style.backgroundColor = 'inherit';
                    
                    // remove error
                    if (document.getElementById('jb_products_new_error_message')) {
                        document.getElementById('jb_products_new_error_message').remove();
                    }
                }
                
                if (status == "Valid" && !confirm("Please confirm that you want to add this product!")) {
                return false;
                }
                
                submitForm("#" + formID, status, submitButtonID);
                
            });
            }
        });
        };
        // rest of this code is the same
    
        const initSearch = () => {
        var searchKeyword = $("#pSearchProduct").val();
        var categoryId = $("#categoryId").val();
        if (searchKeyword !== "") {
            $("#inventory_search_keyword").val(searchKeyword);
            blockElement(productSearchResultsDiv, "block");
            $.ajax({
            type: "GET",
            dataType: "html",
            url: "receiving/search",
            data: { keyword: searchKeyword, category_id: categoryId },
            })
            .done(function (html) {
                $(productSearchResultsDiv).html(html);
            })
            .fail(function (msg) {
                console.log("FAIL", msg);
                alert("Sorry, something went wrong, please try again!");
            })
            .always(function (msg) {
                blockElement(productSearchResultsDiv, "unblock");
            });
        }
        };
    
        const handleInventoryBySelector = () => {
        $(".inventory_by_selector").click(function (e) {
            const selectorToUse = $(this).attr("data-use");
            const selectorToHide = $(this).attr("data-hide");
            const selectorDiv = $("#inventory_by_" + selectorToUse);
            const selectorDivHide = $("#inventory_by_" + selectorToHide);
            selectorDiv.removeClass("d-none");
            selectorDiv.find("select.form-select").val("").trigger("change");
            $("#inventory_by_input").val(selectorToUse);
            selectorDivHide.addClass("d-none");
            selectorDivHide.find("select.form-select").val("").trigger("change");
        });
        };
    
        const handleInventoryModal = () => {
        var inventoryModal = new bootstrap.Modal(
            document.getElementById("rc_new_inventory_modal"),
            {
            backdrop: "static",
            }
        );
        $("body").on("click", ".inventory_select_btn", function (e) {
            e.preventDefault();
            var index = $(this).data("index");
            var id = $(this).data("id");
            var keyWord = $("#pSearchProduct").val();
            var productName = $("#searchProductName-" + index).text();
            var productGtin = $("#searchProductGtin-" + index).text();
            var productImage = $("#searchProductImage-" + index).attr("src");
            var inCatalog = $(this).data("catalog");
            $("#inventory_product_id").val(id);
            if (!inCatalog) {
            $(".inventory_by_selector").addClass("d-none");
            $("#searchProductModalName").text(keyWord);
            $("#searchProductModalGtin").addClass("d-none");
            $("#searchProductModalImage").addClass("d-none");
            $("#inventory_meta").removeClass("d-none");
            $(".product_gtin").attr("value", "");
            } else {
            $("#inventory_product_skus").data("ajax--data", { id: id });
            $(".inventory_by_selector").removeClass("d-none");
            $("#inventory_product_skus")
                .select2("destroy")
                .select2({ minimumResultsForSearch: "Infinity" });
            $("#inventory_product_skus").empty().trigger("change");
            $("#searchProductModalName").text(productName).removeClass("d-none");
            $("#searchProductModalGtin").text(productGtin).removeClass("d-none");
            $(".product_gtin").attr("value", productGtin);
            $("#searchProductModalImage")
                .attr("src", productImage)
                .removeClass("d-none");
            $("#inventory_meta").addClass("d-none");
            }
            $("#rc_new_inventory_modal_form").trigger("reset");
    
            $("#inventory_by_sku").addClass("d-none");
            $("#inventory_by_condition").removeClass("d-none");
            inventoryModal.show();
    
            $("[name='inventory[po_id]'], [name='inventory[condition_id]']").on(
            "change",
            function () {
                // Get the selected value
                checkPOAlerts();
            }
            );
            $("[name='inventory[item_id]'], [name='inventory[condition_id]']").on(
            "change",
            function (event) {
                var elementName = event.target.name;
                // Perform any further actions based on the element name
                var selectedId = $(event.target).val();
                var type =
                elementName === "inventory[item_id]" ? "item_id" : "condition_id";
                checkSkuAlerts(id, selectedId, type);
            }
            );
        });
        };
    
        const checkPOAlerts = () => {
        var po_id = $("[name='inventory[po_id]']").val();
        if (!po_id) {
            return;
        }
        var conditionId = $("[name='inventory[condition_id]']").val();
        var html = "";
        $.ajax({
            type: "GET",
            dataType: "json",
            url: "ajax/actions/poalerts/" + po_id,
            data: { condition_id: conditionId },
        })
            .done(function (res) {
            if (res && res.results && res.results.length > 0) {
                $.each(res.results, function (i, v) {
                html += v + "<br/>";
                });
                $("#po_alerts").html(
                '<div class="alert alert-danger my-5">' + html + "</div>"
                );
            } else {
                $("#po_alerts").html("");
            }
            })
            .fail(function (msg) {
            console.log("FAIL", msg);
            });
        };
    
        const checkSkuAlerts = (productid, selectedId, type) => {
        if (!productid || !selectedId || !type) {
            return;
        }
        var html = "";
        $.ajax({
            type: "GET",
            dataType: "json",
            url: "ajax/actions/skualerts/" + productid,
            data: { id: selectedId, type: type },
        })
            .done(function (res) {
            if (res && res.results && res.results.length > 0) {
                $.each(res.results, function (i, v) {
                html += v + "<br/>";
                });
                $("#sku_alerts").html(
                '<div class="alert alert-danger my-5">' + html + "</div>"
                );
            } else {
                $("#sku_alerts").html("");
            }
            })
            .fail(function (msg) {
            console.log("FAIL", msg);
            });
        };
    
        // Public methods
        return {
        init: function () {
            handleInventoryModal();
            handleInventoryBySelector();
            handleAddInventory();
            $("#pSearchProduct").on("keydown", function (e) {
            if (e.which === 13) {
                e.preventDefault();
                initSearch();
            }
            });
            $("#rc_new_inventory_modal").on("hidden.bs.modal", function (e) {
            // This function will be triggered when the modal is closed
            $("#rc_new_inventory_modal_form")[0].reset();
            });
        },
        };
    })();
    
    // On document ready
    KTUtil.onDOMContentLoaded(function () {
        RCnewInventory.init();
    });
}