const deleteProduct = (btn) => {
    const productId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
    const productElement = btn.closest("article")

    fetch(`/admin/product/${productId}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrf },
    })
        .then(result => {
            if (!result.ok) {
                throw new Error(`خطا با کد ${result.status}`);
            }
            return result.json();
        })
        .then(data => {
            console.log(data);
            productElement.parentNode.removeChild(productElement)
        })
        .catch(err => {
            console.error('حذف محصول با خطا مواجه شد:', err);
        });

}