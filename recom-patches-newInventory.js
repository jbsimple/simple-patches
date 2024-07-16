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