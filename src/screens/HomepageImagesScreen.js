import React from "react";
import { View, StyleSheet } from "react-native";
import { HomepageImagesPage } from "../../components/settings/homepage-images-page";

const HomepageImagesScreen = () => {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <HomepageImagesPage />
    </View>
  );
};

export default HomepageImagesScreen;