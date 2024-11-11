import jwt from 'jsonwebtoken'

const authenticateUser = (ctx, next) => {
    const userId = ctx.from.id;
    const authorizedUserIds = process.env.AUTHORIZED_USER_IDS.split(',');

    if (authorizedUserIds.includes(userId.toString())) {
        return next(); 
    } else {
        ctx.reply("You are not authorized to upload movies.");
    }
};





export default authenticateUser
