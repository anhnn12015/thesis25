import React from 'react';

const Settings = () => {
  return (
    <div className="p-6 text-white bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Cài đặt hệ thống</h1>
      <form className="space-y-6 max-w-xl">
        {/* Tên website */}
        <div>
          <label className="block mb-2 font-semibold">Tên website</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            placeholder="Nhập tên website"
          />
        </div>

        {/* Email quản trị */}
        <div>
          <label className="block mb-2 font-semibold">Email quản trị</label>
          <input
            type="email"
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            placeholder="admin@email.com"
          />
        </div>

        {/* Ngôn ngữ mặc định */}
        <div>
          <label className="block mb-2 font-semibold">Ngôn ngữ mặc định</label>
          <select className="w-full p-2 rounded bg-gray-800 border border-gray-700">
            <option>Tiếng Việt</option>
            <option>English</option>
          </select>
        </div>

        {/* Trạng thái hệ thống */}
        <div>
          <label className="block mb-2 font-semibold">Trạng thái hệ thống</label>
          <select className="w-full p-2 rounded bg-gray-800 border border-gray-700">
            <option>Hoạt động</option>
            <option>Bảo trì</option>
          </select>
        </div>

        {/* Nút lưu */}
        <div>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
          >
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
