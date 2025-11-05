import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isVerified: false,
  loading: true,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isVerified = action.payload?.emailVerified || false;
      state.loading = false;
    },
    clearUser: (state) => {
      state.user = null;
      state.isVerified = false;
      state.loading = false;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
