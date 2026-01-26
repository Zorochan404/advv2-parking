export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/v2/login',
        REGISTER: '/auth/v2/register',
        ME: '/auth/me',
    },
    USER: {
        PROFILE: '/user/profile',
        UPDATE: '/user/updateuser',
        GET_USER: '/user/getuser',
    },
    CAR_REQUEST: {
        GET_ASSIGNED: '/car-request/parking/getrequests',
        APPROVE: '/car-request/:id/approve',
        DENY: '/car-request/:id/deny',
    },
    CARS: {
        ADD: '/cars/add',
        GET_BY_PARKING: '/cars/carbyparking/:id',
        GET_DETAILS: '/cars/getcar/:id',
        UPDATE: '/cars/:id',
    },
    PARKING: {
        SUBMIT_APPROVAL: '/parking/submit-approval',
    },
    BOOKING: {
        PIC_DASHBOARD: '/booking/pic/dashboard',
        CONFIRM_PICKUP: '/booking/confirm-pickup',
    },
    // Add feature/domain specific endpoints here
} as const;
