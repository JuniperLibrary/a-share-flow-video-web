/**
 * 基金页的弹层都 portal 到 `document.body`，会跳出 `.fund-app` 作用域，
 * 导致弹层里的 fund.css 样式（`.modal`、`.drawer-*`、`.table-row` 等）全部失效。
 *
 * 这层包裹把作用域带进 body，同时用 `display: contents` 让包裹元素不产生布局盒，
 * 弹层原有的 fixed 定位、尺寸与层叠上下文都不受影响。
 */
export default function PortalScope({ children }) {
  return (
    <div className="fund-app" style={{ display: 'contents' }}>
      {children}
    </div>
  );
}
