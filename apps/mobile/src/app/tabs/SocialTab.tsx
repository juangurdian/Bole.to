import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import EventFeedScreen from "../../screens/Social/EventFeedScreen";
import PostComposer from "../../screens/Social/PostComposer";
import PollScreen from "../../screens/Social/PollScreen";
import CaptureScreen from "../../screens/Camera/CaptureScreen";
import GalleryScreen from "../../screens/Camera/GalleryScreen";

const Stack = createNativeStackNavigator();

export default function SocialTab() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="EventFeedScreen" component={EventFeedScreen} options={{ title: "Event Social" }} />
      <Stack.Screen name="PostComposer" component={PostComposer} options={{ title: "Create Post" }} />
      <Stack.Screen name="PollScreen" component={PollScreen} options={{ title: "Poll" }} />
      <Stack.Screen name="CaptureScreen" component={CaptureScreen} options={{ title: "Take Photo" }} />
      <Stack.Screen name="GalleryScreen" component={GalleryScreen} options={{ title: "Event Gallery" }} />
    </Stack.Navigator>
  );
}