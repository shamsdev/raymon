module.exports = {
    list: {},
    add(user) {
        this.list[user.id] = user;
    },
    get(id) {
        return this.list[id];
    },
    remove(id){
        delete this.list[id];
    }
};
