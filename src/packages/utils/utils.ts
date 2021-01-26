export function deepcopy(obj: any) {
    // if (typeof obj === 'object') {
    //     return Object.assign({}, obj);
    // } else if (Array.isArray(obj)) {
        
    // }
    let result: any[] = [];
    obj.forEach((item: any, index: any) => {
        result.push(item);
    })
    return result;
}