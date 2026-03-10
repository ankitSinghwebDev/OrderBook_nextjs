import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  members: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token || state.token;
    },
    setMembers(state, action) {
      state.members = action.payload || [];
    },
    clearUser(state) {
      state.user = null;
      state.token = null;
      state.members = [];
    },
  },
});

export const { setUser, clearUser, setMembers } = userSlice.actions;
export default userSlice.reducer;
