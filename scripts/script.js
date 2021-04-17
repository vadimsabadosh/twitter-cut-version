class FetchData {
    getData = async url => {
        const result = await fetch(url);
        if(!result.ok){
            throw new Error('Ошибка в FetchData: ' + result.status)
        }
        return result.json();
    }
    getPost = () => this.getData('db/database.json');
}



class Twitter {
    constructor({ 
        user, 
        listElem, 
        modalElems, 
        tweetElems, 
        classDeleteTweet,
        classLikeTweet,
        sortElem,
        showLikedPostElem,
        showUserPostsElem
    }){
        const fetchData = new FetchData();
        this.user = user;
        this.tweets = new Posts();
        this.elements = {
            listElements: document.querySelector(listElem),
            sortElement: document.querySelector(sortElem),
            likedElement: document.querySelector(showLikedPostElem),
            userPostElement: document.querySelector(showUserPostsElem),
            modal: modalElems,
            tweetElems,
        }
        this.class = {
            classDeleteTweet,
            classLikeTweet
        }
        this.sortDate = true;
        fetchData.getPost().then(data => {
            data.forEach(item => {
                this.tweets.addPost(item);
            });
            this.showAllPosts();
        });
        this.elements.modal.forEach(this.handlerModal, this);
        this.elements.tweetElems.forEach(this.addTweet, this);
        this.elements.listElements.addEventListener('click', this.handlerTweet);
        this.elements.sortElement.addEventListener('click', this.changeSort);
        this.elements.likedElement.addEventListener('click', this.showLikedPosts);
        this.elements.userPostElement.addEventListener('click', this.showUserPosts);
    }

    renderPosts(tweets){
        const sortTweets = tweets.sort(this.sortFields())

        this.elements.listElements.textContent = '';

        sortTweets.forEach(({id, userName, nickname, getDate, text, img, likes, liked}) => {
            
            this.elements.listElements.insertAdjacentHTML('beforeend', `
                <li>
                    <article class="tweet">
                        <div class="row">
                            <img class="avatar" src="images/${nickname}.jpg" alt="Аватар пользователя ${nickname}">
                            <div class="tweet__wrapper">
                                <header class="tweet__header">
                                    <h3 class="tweet-author">${userName}
                                        <span class="tweet-author__add tweet-author__nickname">@${nickname}</span>
                                        <time class="tweet-author__add tweet__date">${getDate()}</time>
                                    </h3>
                                    <button class="tweet__delete-button chest-icon" data-id="${id}"></button>
                                </header>
                                <div class="tweet-post">
                                    <p class="tweet-post__text">${text}</p>
                                ${ img ? `<figure class="tweet-post__image">
                                        <img src="${img}" alt="Сообщение Марии Lorem ipsum dolor sit amet, consectetur.">
                                    </figure>` : ''}
                                </div>
                            </div>
                        </div>
                        <footer>
                            <button data-id="${id}" class="tweet__like ${liked ? this.class.classLikeTweet.active : ''}">
                                ${likes}
                            </button>
                        </footer>
                    </article>
                </li>
            `);
        })
    }

    showUserPosts = () => {
        const post = this.tweets.posts.filter(tweet => tweet.nickname === this.user.nickname)
        this.renderPosts(post)
    }

    showLikedPosts = () => {
        const post = this.tweets.posts.filter(tweet => tweet.liked)
        this.renderPosts(post)
    }
      
    showAllPosts(){
        this.renderPosts(this.tweets.posts)
    }

    handlerModal({button, modal, overlay, close}){
        
        const buttonElem = document.querySelector(button);
        const modalElem = document.querySelector(modal);
        const overlayElem = document.querySelector(overlay);
        const closeElem = document.querySelector(close);
        //const tweetBtnElem = document.querySelector(tweetBtn);

        const openModal = () => {
            modalElem.style.display = 'block';
        }
        const closeModal = (elem, e) => {
            let target = e.target;
            if(target === elem){
                modalElem.style.display = '';
            } 
        }
        buttonElem.addEventListener('click', openModal);
        if(closeElem){
            closeElem.addEventListener('click', closeModal.bind(null, closeElem))
        }
        if(overlayElem){
            overlayElem.addEventListener('click', closeModal.bind(null, overlayElem))
        }
        this.handlerModal.closeModal = () => {
            modalElem.style.display = '';
        };
        // if(tweetBtnElem){
        //     tweetBtnElem.addEventListener('click', closeModal.bind(null, tweetBtnElem))
        // }
    }
    addTweet({text, img, submit}){
        const textElem = document.querySelector(text);
        const imgElem = document.querySelector(img);
        const submitElem = document.querySelector(submit);

        let imgUrl = '';
        let tempString = textElem.innerHTML;

        submitElem.addEventListener('click', () => {
            this.tweets.addPost({
                userName: this.user.name,
                nickname: this.user.nickname,
                text: textElem.innerHTML,
                img: imgUrl,

            });
            this.showAllPosts();
            this.handlerModal.closeModal();
            textElem.innerHTML = tempString;
        });
        textElem.addEventListener('click', () => {
            if(textElem.innerHTML === tempString){
                textElem.innerHTML = '';
            }
        });

        imgElem.addEventListener('click', () => {
            imgUrl = prompt('Введите адрес картинки');
        })
    }
    handlerTweet = e => {
        let target = e.target;
        if(target.classList.contains(this.class.classDeleteTweet)){
            console.log(target.dataset.id);
            this.tweets.deletePost(target.dataset.id);
            this.showAllPosts();
        }
        if(target.classList.contains(this.class.classLikeTweet.like)){
            this.tweets.likePost(target.dataset.id);
            this.showAllPosts();
        }
    }
    changeSort = () =>{
        this.sortDate = !this.sortDate
        this.showAllPosts();
    }
    sortFields(){
        if(this.sortDate){
            return (a, b) => {
                const dateA = new Date(a.postDate);
                const dateB = new Date(b.postDate);
                return dateB - dateA;
            }
        }else{
            return (a, b) => {
                return b.likes - a.likes
            }
        }
    }
}

class Posts {
    constructor({ posts = [] } = {}){
        this.posts = posts;
    }
    addPost = tweets => {
        this.posts.unshift(new Post(tweets));
    }
    deletePost(id){
        this.posts = this.posts.filter(post => post.id !== id);
    }
    likePost(id){
        this.posts.forEach(item => {
            if(item.id === id){
                item.changeLike()
            }
        })
    }
}

class Post{
    constructor({ id, userName, nickname, postDate, text, img, likes = 0 }){
        this.id = id || this.generateID();
        this.userName = userName;
        this.nickname = nickname;
        this.postDate = postDate ? this.correctDate(postDate) : new Date();
        this.text = text;
        this.img = img;
        this.likes = likes;
        this.liked = false;
    }
    changeLike(){
        this.liked = !this.liked;
        if(this.liked){
            this.likes++;
        }else{
            this.likes--;
        }
    }
    generateID(){
        return Math.random().toString(32).substring(2, 9) + (+new Date().toString(32));
    }
    getDate = () =>{
        const options = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }
        return this.postDate.toLocaleString('ua-UA', options);
    }
    correctDate(date){
        if(isNaN(Date.parse(date))){
            date = date.raplace(/\./g, '/')
        }
        return new Date(date)
    }
}

const twitter = new Twitter({
    listElem: '.tweet-list',
    user: {
        name: 'max',
        nickname: 'maxxxMaxim',
    },
    modalElems: [
        {
            button: '.header__link_tweet',
            modal: '.modal',
            overlay: '.overlay',
            close: '.modal-close__btn',
        }
    ],
    tweetElems:[
        {
            text: '.modal .tweet-form__text',
            img: '.modal .tweet-img__btn',
            submit: '.modal .tweet-form__btn',
        },
        {
            text: '.tweet-form__text',
            img: '.tweet-img__btn',
            submit: '.tweet-form__btn',
        }
    ],
    classDeleteTweet: 'tweet__delete-button',
    classLikeTweet: {
        like: 'tweet__like',
        active: 'tweet__like_active'
    },
    sortElem: '.header__link_sort',
    showUserPostsElem: '.header__link_profile',
    showLikedPostElem: '.header__link_likes',
    
    
});


