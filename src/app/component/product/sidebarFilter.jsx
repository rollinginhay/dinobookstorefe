export default function SidebarFilter() {
  return (
    <div className=" sidebar-filter">
      <h3>GIÁ</h3>
      <ul>
        <li>
          <input type="checkbox" /> 0đ - 150.000đ
        </li>
        <li>
          <input type="checkbox" /> 150.000đ - 300.000đ
        </li>
        <li>
          <input type="checkbox" /> 300.000đ - 500.000đ
        </li>
        <li>
          <input type="checkbox" /> 500.000đ - 700.000đ
        </li>
        <li>
          <input type="checkbox" /> 700.000đ - Trở Lên
        </li>
      </ul>

      <h3>GENRES</h3>
      <ul>
        <li>
          <input type="checkbox" /> Comedy
        </li>
        <li>
          <input type="checkbox" /> Shounen
        </li>
        <li>
          <input type="checkbox" /> Adventure
        </li>
        <li>
          <input type="checkbox" /> Drama
        </li>
        <li>
          <input type="checkbox" /> Action
        </li>
        <li>
          <input type="checkbox" /> School Life
        </li>
        <li>
          <input type="checkbox" /> Sci Fi
        </li>
        <li>
          <input type="checkbox" /> Fantasy
        </li>
      </ul>
    </div>
  );
}
