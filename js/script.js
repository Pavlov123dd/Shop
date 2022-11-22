const API = `https://634e9f834af5fdff3a625f84.mockapi.io`;
const loginForm = document.querySelector(`#loginForm`);
const headerUser = document.querySelector(`#headerUser`);
const headerLogout = document.querySelector(`#headerLogout`);
const headerShoppingCart = document.querySelector(`#headerShoppingCart`);
const headerShoppingCartCount = document.querySelector(`#headerShoppingCartCount`);
const registrationForm = document.querySelector(`#registrationForm`);
const shoppingCartTable = document.querySelector(`#shoppingCartTable`);
const orderTable = document.querySelector(`#orderTable`);
const orderSummaryTotal = document.querySelector(`#orderSummaryTotal`);
const categoriesContainer = document.querySelector(`#categoriesContainer`);
let priceAfterSale = 0;


const controller = async (url, method = `GET`, obj) => {
    let options = {
        method: method,
        headers: {
            "Content-type": "application/json;charset=UTF-8"
        }
    };
    if (obj) options.body = JSON.stringify(obj);
    let request = await fetch(url, options),
        response = request.ok ? request.json() : Promise.catch(request.statusText);
    return response;
};

const assembly = async () => {
    let getUsers = await controller(API + `/users`);
    const getProducts = await controller(API + `/products`);

    loginForm && verification(getUsers);
    localStorage.getItem(`email`) && logIn(getUsers);
    logOut(getUsers);
    registrationForm && userRegistration(getUsers);
    shoppingCartTable && shoppingCart(getUsers, getProducts);
    renderHomePage(getUsers, getProducts);
    orderTable && creatAccount(getUsers, getProducts);
};


const verification = users => {
    const error = document.querySelector(`.error`);
    const inputEmail = document.querySelector(`#inputEmail`);
    const inputPassword = document.querySelector(`#inputPassword`);

    loginForm.addEventListener(`submit`, async e => {
        e.preventDefault();
        let user = users.find(user => (user.email === inputEmail.value) && (user.password === inputPassword.value));

        if (user) {
            localStorage.setItem(`email`, user.email);
            await controller(API + `/users/${user.id}`, `PUT`, {status: true});
            window.location.href = `index.html`;
            logIn(users);
        } else {
            error.style.display = `block`;
        }
    });
};

const logIn = users => {

    let user = users.find(user => (user.email === (localStorage.getItem(`email`))));
    if (user) {
        headerUser.innerHTML = user.name;
        headerUser.href = `account.html`;
        headerLogout.style.display = `block`;
        headerShoppingCartCount.innerHTML = user.shoppingCart.length
    }
};

const logOut = users => {

    headerLogout.addEventListener(`click`, async () => {
        let user = users.find(user => (user.email === (localStorage.getItem(`email`))));
        await controller(API + `/users/${user.id}`, `PUT`, {status: false});

        localStorage.removeItem('email');
        headerUser.innerHTML = `Log in`;
        headerUser.href = `login.html`;
        headerLogout.style.display = `none`;
        window.location.href = `index.html`;
    });
};

const userRegistration = users => {

    registrationForm.addEventListener(`submit`, async e => {
        e.preventDefault();

        const userName = registrationForm.querySelector(`input[data-name="name"]`).value;
        const userEmail = (registrationForm.querySelector(`input[data-name="email"]`).value).toLowerCase().trim();
        const userPassword = (registrationForm.querySelector(`input[data-name="password"]`).value).trim();
        const verifyPassword = (registrationForm.querySelector(`input[data-name="password"]`).value).trim();
        const error = registrationForm.querySelector(`.error`);

        let user = users.find(user => (user.email === userEmail));
        if (user) error.style.display = `block`;
        if (userPassword !== verifyPassword) error.style.display = `block`;

        let newUser = {
            name: userName,
            email: userEmail,
            password: userPassword,
            status: true
        };

        await controller(API + `/users`, `Post`, newUser);
        localStorage.setItem(`email`, userEmail);
        logIn(users);
        window.location.href = `index.html`;

    })
};

const completeOrder = user => {
    const orderSummary = document.querySelector(`#orderSummary`);

    orderSummary.addEventListener(`submit`, async e => {
        e.preventDefault();
        user.orders = user.orders.concat(user.shoppingCart);
        user.shoppingCart = [];
        await controller(API + `/users/${user.id}`, `PUT`, user);
        window.location.href = `account.html`;
    });
};

const shoppingCart = (users, getProducts) => {

    let userProducts = [];
    let productId = [];
    let user = users.find(user => (user.email === (localStorage.getItem(`email`))));
    productId = (user.shoppingCart).map(item => item.id);
    productId.forEach(item => userProducts = userProducts.concat(getProducts.filter(product => product.id == item)));
    userProducts.forEach(item => renderShoppingCartTable(item, users, getProducts));
    totalPriceRender(users, getProducts);
    completeOrder(user);

};

const totalPriceRender = (users, getProducts) => {

    let allProductInShoppingCart = [];
    let SummaryTotal = 0;
    let user = users.find(user => (user.email === (localStorage.getItem(`email`))));
    let idProduct = user.shoppingCart.map(item => item.id);

    idProduct.forEach(id => allProductInShoppingCart.push(getProducts.find(prod => prod.id === id)));

    Object.keys(user.shoppingCart).forEach(item => allProductInShoppingCart[item].sale
        ? SummaryTotal += ((allProductInShoppingCart[item].price - allProductInShoppingCart[item].price * allProductInShoppingCart[item].salePercent / 100) * user.shoppingCart[item].count)
        : SummaryTotal += ((allProductInShoppingCart[item].price) * user.shoppingCart[item].count));

    if (orderSummaryTotal) orderSummaryTotal.innerHTML = `$ ${SummaryTotal}`;

};

const renderShoppingCartTable = async (item, users, getProducts) => {

    let user = users.find(user => (user.email === (localStorage.getItem(`email`))));
    let arrIdCount = user.shoppingCart.find(prod => prod.id === item.id);

    const tbody = document.createElement(`tbody`);
    const tdImg = document.createElement(`td`);
    const tdPrice = document.createElement(`td`);
    const tdPriceSale = document.createElement(`td`);
    const tdInput = document.createElement(`td`);
    const tdTotalPrice = document.createElement(`td`);
    const trProduct = document.createElement(`tr`);
    const tdBtn = document.createElement(`td`);
    const btn = document.createElement(`button`);
    const input = document.createElement(`input`);

    tdImg.innerHTML = `
                <div class ="item__info">
                    <img
                        src="images/products/${item.img}.png"
                        alt="${item.title}"
                        height="100"
                    />
                <div>
                    <p class ="item__info--title">${item.title}</p>
                </div>
                </div>`;

    tdPrice.innerHTML = `<td>$${item.price}</td>`;

    input.type = "number";
    input.value = arrIdCount.count;
    tdInput.append(input)

    input.addEventListener(`change`, async () => {
        arrIdCount.count = input.value
        user.shoppingCart.map(prod => prod.id === arrIdCount.id ? prod = arrIdCount.id : prod)
        await controller(API + `/users/${user.id}`, `PUT`, user);
        total();
        completeOrder(user);
        totalPriceRender(users, getProducts);
    });

    const total = () => {
        item.sale ? tdPriceSale.innerHTML = `<span class="item__sale"> - ${item.salePercent}% </span>` : tdPriceSale.innerHTML = `-`;
        item.sale ? priceAfterSale = arrIdCount.count * item.price * ((100 - item.salePercent) / 100) : priceAfterSale = arrIdCount.count * item.price;
        tdTotalPrice.innerHTML = `$ ${priceAfterSale} `;
    };

    btn.classList.add(`item__remove`);
    btn.innerHTML = `<img src="images/delete.png" alt="delete" height="20">`;

    btn.addEventListener(`click`, async () => {
        const getUsers = await controller(API + `/users`);
        let user = getUsers.find(user => (user.email === (localStorage.getItem(`email`))));
        let userShoppingCart = user.shoppingCart.filter(item => item.id !== arrIdCount.id);
        user.shoppingCart = userShoppingCart;
        await controller(API + `/users/${user.id}`, `PUT`, user);
        trProduct.remove();
        headerShoppingCartCount.innerHTML = user.shoppingCart.length;
        totalPriceRender(getUsers, getProducts);
    });

    tdBtn.append(btn);
    trProduct.append(tdImg);
    trProduct.append(tdPrice);
    trProduct.append(tdPriceSale);
    trProduct.append(tdInput);
    trProduct.append(tdTotalPrice);
    trProduct.append(tdBtn);
    tbody.append(trProduct);
    shoppingCartTable.append(tbody);
    total();
};


const renderHomePage = (getUsers, getProducts) => {
    let user = getUsers.find(user => (user.email === (localStorage.getItem(`email`))));
    const categoryProduct = [];
    if (!user) headerShoppingCart.href = `login.html`;

    getProducts.forEach(prod =>
        !(categoryProduct.includes(prod.category))
        && categoryProduct.push(prod.category));

    const filter = categoryProduct.map(item =>
        getProducts.filter(prod => prod.category === item));

    filter.forEach(products => renderProductToHomePage(products, products[0].category, user));
};


const renderProductToHomePage = (products, category, user) => {

    const section = document.createElement(`section`);
    const titleTwo = document.createElement(`h2`);
    const divCategoryContainer = document.createElement(`div`);
    section.classList.add(`category`);
    section.id = category;
    titleTwo.innerHTML = category;
    divCategoryContainer.classList.add(`category__container`);
    if(!user) headerShoppingCartCount.innerHTML=`0`;

    const renderProductCard = (prod, user) => {
        let lastPrice = 0;
        const div = document.createElement(`div`);
        const img = document.createElement(`img`);
        const p = document.createElement(`p`);
        const productInfo = document.createElement(`div`);
        const prodPrice = document.createElement(`span`);
        const btn = document.createElement(`button`);
        const imgCart = document.createElement(`img`);

        div.classList.add(`product`);
        div.dataset.id = prod.id

        img.src = `images/products/${prod.img}.png`;
        img.classList.add(`product__img`);
        img.alt = prod.title;
        img.height = `80`;

        p.classList.add(`product__title`);
        p.innerHTML = prod.title;

        div.append(img);
        div.append(p);

        prod.sale ? lastPrice = prod.price * (100 - prod.salePercent) / 100 : lastPrice = prod.price;

        if (prod.sale) {
            const divProductSale = document.createElement(`div`);
            divProductSale.classList.add(`product__sale`)
            const spanProductSaleOld = document.createElement(`span`);
            spanProductSaleOld.classList.add(`product__sale--old`);
            spanProductSaleOld.innerHTML = `$${prod.price}`;
            const spanProductSalePercent = document.createElement(`span`);
            spanProductSalePercent.classList.add(`product__sale--percent`);
            spanProductSalePercent.innerHTML = `- ${prod.salePercent} %`;
            divProductSale.append(spanProductSaleOld);
            divProductSale.append(spanProductSalePercent);
            div.append(divProductSale);
        }

        productInfo.classList.add(`product__info`);
        prodPrice.classList.add(`product__price`);
        prodPrice.innerHTML = `$${lastPrice}`;
        btn.classList.add(`product__cart`);

        user && user.shoppingCart.find(item => item.id === div.dataset.id) && btn.classList.add(`product__cart--in`);

        imgCart.src = `images/shopping-cart.png`;
        imgCart.alt = `shopping cart`;
        imgCart.height = `20`

        btn.append(imgCart);
        productInfo.append(prodPrice);
        productInfo.append(btn);
        div.append(productInfo);
        divCategoryContainer.append(div);


        btn.addEventListener(`click`, async (e) => {

            if (!user) {
                window.location.href = `login.html`
            } else {
                btn.classList.toggle(`product__cart--in`);
                let searchProduct = user.shoppingCart.find(item => item.id === div.dataset.id);

                searchProduct ? user.shoppingCart = user.shoppingCart.filter(item => item.id !== searchProduct.id)
                    : user.shoppingCart = user.shoppingCart.concat({id: div.dataset.id, count: '1'});

                await controller(API + `/users/${user.id}`, `PUT`, user);
                headerShoppingCartCount.innerHTML = user.shoppingCart.length;
            }
        });
    };

    products.forEach(item => renderProductCard(item, user));
    section.append(titleTwo);
    section.append(divCategoryContainer);
    categoriesContainer && categoriesContainer.append(section);

};

const myInfo = user => {
    const userInfoEmail = document.querySelector(`#userInfoEmail`);
    const userInfoName = document.querySelector(`#userInfoName`);
    const deleteAccBtn = document.querySelector(`#deleteAcc`);
    userInfoEmail.innerHTML = user.email;
    userInfoName.innerHTML = user.name;

    deleteAccBtn.addEventListener(`click`, async () => {
        await controller(API + `/users/${user.id}`, `DELETE`);
        window.location.href = `index.html`;
        console.log(`delete`)
    });
};


const creatAccount = (getUsers, products) => {

    const tbody = document.createElement(`tbody`);
    let userProducts = [];
    let productId = [];
    let user = getUsers.find(user => (user.email === (localStorage.getItem(`email`))))
    myInfo(user);

    productId = (user.orders).map(item => item.id);
    productId.forEach(item => userProducts = userProducts.concat(products.filter(product => product.id == item)))

    const creatAccountElement = (product) => {

        const tr = document.createElement(`tr`);
        const imgTd = document.createElement(`td`);
        const imgDiv = document.createElement(`div`);
        const img = document.createElement(`img`);
        const titleDiv = document.createElement(`div`);
        const titleP = document.createElement(`p`);
        const tdPrice = document.createElement(`td`);
        const tdSale = document.createElement(`td`);
        const spanSale = document.createElement(`span`);
        const countTd = document.createElement(`td`);
        const totalTd = document.createElement(`td`);
        imgDiv.classList.add(`item__info`);

        img.src = `images/products/${product.img}.png`;
        img.alt = `${product.title}`;
        img.height = `100`;
        titleP.classList.add(`item__info--title`);
        titleP.innerHTML = product.title;
        tdPrice.innerHTML = `$${product.price}`;

        (product.sale) ? spanSale.innerHTML = `-${product.salePercent}%` : spanSale.innerHTML = `-`;
        spanSale.innerHTML !== `-` && spanSale.classList.add(`item__sale`);

        let arrIdCount = user.orders.find(prod => prod.id === product.id);

        countTd.innerHTML = arrIdCount.count;

        (product.sale) ? totalTd.innerHTML = `$${product.price * ((100 - product.salePercent) / 100) * arrIdCount.count}`
            : totalTd.innerHTML = `$${product.price * arrIdCount.count}`;

        tbody.append(tr);
        tr.append(imgTd);
        imgTd.append(imgDiv);
        imgDiv.append(img);
        titleDiv.append(titleP);
        imgDiv.append(titleDiv);
        tr.append(tdPrice);
        tdSale.append(spanSale);
        tr.append(tdSale);
        tr.append(countTd);
        tr.append(totalTd);

    };

    userProducts.forEach(item => creatAccountElement(item));
    orderTable.append(tbody);
};

assembly();

