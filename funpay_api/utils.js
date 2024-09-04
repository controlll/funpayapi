export const getUsersId = (id1, id2)=>{
    if(parseInt(id1) < parseInt(id2))
        return `users-${id1}-${id2}`;
    else
        return `users-${id2}-${id1}`;
}