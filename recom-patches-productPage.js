// one day I will add this
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