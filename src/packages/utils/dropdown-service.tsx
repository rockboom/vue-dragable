import { computed, createApp, defineComponent, getCurrentInstance, inject, onBeforeUnmount, onMounted, PropType, provide, reactive, ref } from "vue";
import { defer } from "./defer";
import './dropdown-service.scss'

interface DropdownServiceOption {
    reference: MouseEvent | HTMLElement;
    content: () => JSX.Element;
}

const DropdownServiceProvider = (() => {
    const DROPDOWN_SERVICE_PROVIDER = '@@DROPDOWN_SERVICE_PROVIDER';
    return {
        provide: (handler: { onClick: () => void }) => provide(DROPDOWN_SERVICE_PROVIDER, handler),
        ineject: () => inject(DROPDOWN_SERVICE_PROVIDER) as { onClick: () => void },
    }
})()

const ServiceCompoent = defineComponent({
    props: { option: { type: Object as PropType<DropdownServiceOption>, required: true } },
    setup(props) {
        const ctx = getCurrentInstance()!
        const el = ref({} as HTMLDivElement);

        const state = reactive({
            option: props.option,
            showFlag: false,
            top: 0,
            left: 0,
            mounted: (() => {
                const dfd = defer();
                onMounted(() => {
                    setTimeout(() => dfd.resolve(), 0);
                });
                return dfd.promise;
            })()
        })
        const service = (option: DropdownServiceOption) => {
            state.option = option;

            if ('addEventListener' in option.reference) {
                const { top, left, height } = option.reference.getBoundingClientRect()!
                state.top = top + height;
                state.left = left;
            } else {
                const { clientX, clientY } = option.reference;
                state.top = clientY;
                state.left = clientX;
            }
            methods.show();
        }
        const methods = {
            show: async () => {
                await state.mounted;
                state.showFlag = true;
            },
            hide: () => {
                state.showFlag = false;
            }
        }
        const classes = computed(() => [
            'dropdown-service',
            {
                'dropdown-service-show': state.showFlag
            }
        ])
        const styles = computed(() => ({
            top: `${state.top}px`,
            left: `${state.left}px`,
        }))
        Object.assign(ctx.proxy, { service });

        const onMousedownDocument = (e: MouseEvent) => {
            // 这种写法导致右键菜单点击失效
            // if (!(e.target as HTMLDivElement).contains(el.value)) {
            //     methods.hide();
            // }

            if (!el.value.contains((e.target as HTMLDivElement))) {
                methods.hide();
            }
        }
        onMounted(() => document.body.addEventListener('mousedown', onMousedownDocument, true));
        onBeforeUnmount(() => document.body.removeEventListener('mousedown', onMousedownDocument, true))
        DropdownServiceProvider.provide({ onClick: methods.hide });
        return () => (
            <div class={classes.value} style={styles.value} ref={el}>
                {state.option.content()}
            </div>
        )
    }
})

export const DropdownOption = defineComponent({
    props: {
        label: { type: String },
        icon: { type: String },
    },
    emits: {
        click: (e: MouseEvent) => true
    },
    setup(props, ctx) {
        const { onClick: dropdownClickHandler } = DropdownServiceProvider.ineject();
        const handler = {
            onClick: (e: MouseEvent) => {
                ctx.emit('click', e);
                dropdownClickHandler();
            }
        }
        return () => (
            <div class="dropdown-option" onClick={handler.onClick}>
                <i class={`iconfont ${props.icon}`}></i>
                <span>{props.label}</span>
            </div>
        )
    }
})

// 当前服务动态挂载到根结点，会丢失上下文，所以不能inject全局provide的数据，即不能通过inject获取provide提供的数据
// 这种服务就会有缺陷，因此用$$标注
export const $$dropdown = (() => {
    let ins: any;
    return (option: DropdownServiceOption) => {
        if (!ins) {
            const el = document.createElement('div');
            document.body.appendChild(el);
            const app = createApp(ServiceCompoent, { option });
            app.component('dropdown-option', DropdownOption);
            ins = app.mount(el);
        }
        ins.service(option);
    }
})()